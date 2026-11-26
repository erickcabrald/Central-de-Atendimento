import { prisma } from "../../lib/prisma.js";
import { GeminiService } from "../chat/gemini.service.js";
import { splitIntoChunks } from "./knowledge-base.utils.js";

type KnowledgeSearchResult = {
  id: string;
  title: string;
  content: string;
  similarity: number;
};

export class KnowledgeBaseService {
  private geminiService = new GeminiService();

  /**
   * Busca os trechos mais relevantes usando similaridade vetorial.
   */
  async search(query: string): Promise<KnowledgeSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    // Gera o embedding da pergunta do aluno.
    const embedding = await this.geminiService.generateEmbedding(
      query,
      "RETRIEVAL_QUERY",
    );

    const vector = `[${embedding.join(",")}]`;

    // Busca os três chunks semanticamente mais próximos.
    const results = await prisma.$queryRaw<KnowledgeSearchResult[]>`
      SELECT
        kc."id",
        kd."title",
        kc."content",
        1 - (kc."embedding" <=> ${vector}::extensions.vector) AS similarity
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeDocument" kd
        ON kd."id" = kc."documentId"
      WHERE
        kc."embedding" IS NOT NULL
        AND kd."status" = 'PROCESSED'
      ORDER BY kc."embedding" <=> ${vector}::extensions.vector
      LIMIT 3
    `;

    return results;
  }

  /**
   * Processa um documento de texto, divide em chunks
   * e salva seus embeddings no banco.
   */
  async processTextDocument(title: string, content: string) {
    if (!title.trim()) {
      throw new Error("O título do documento é obrigatório.");
    }

    const chunks = splitIntoChunks(content);

    if (chunks.length === 0) {
      throw new Error("O conteúdo do documento está vazio.");
    }

    const document = await prisma.knowledgeDocument.create({
      data: {
        title,
        type: "TEXT",
        status: "PROCESSING",
      },
    });

    try {
      for (let index = 0; index < chunks.length; index++) {
        const chunkContent = chunks[index];

        const embedding = await this.geminiService.generateEmbedding(
          chunkContent,
          "RETRIEVAL_DOCUMENT",
        );

        const chunk = await prisma.knowledgeChunk.create({
          data: {
            content: chunkContent,
            chunkIndex: index,
            documentId: document.id,
          },
        });

        const vector = `[${embedding.join(",")}]`;

        await prisma.$executeRaw`
          UPDATE "KnowledgeChunk"
          SET "embedding" = ${vector}::extensions.vector
          WHERE "id" = ${chunk.id}::uuid
        `;
      }

      const updatedDocument = await prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: { status: "PROCESSED" },
      });

      return {
        document: updatedDocument,
        chunksProcessed: chunks.length,
      };
    } catch (error) {
      await prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: { status: "FAILED" },
      });

      throw error;
    }
  }
}
