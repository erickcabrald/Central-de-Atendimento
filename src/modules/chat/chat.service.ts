import type { PrismaClient } from "../../generated/prisma/client.js";

import { GeminiService } from "./gemini.service.js";
import type { SendMessageInput } from "./chat.schema.js";

import { KnowledgeBaseService } from "../knowledge-base/knowledge-base.service.js";

export class ChatService {
  private geminiService = new GeminiService();
  private knowledgeBase = new KnowledgeBaseService();

  constructor(private prisma: PrismaClient) {}

  async sendMessage(userId: string, data: SendMessageInput) {
    let conversationId = data.conversationId;

    // Verifica se a conversa pertence ao usuário
    if (conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!conversation) {
        return null;
      }
    }

    // Recupera as 20 mensagens mais recentes
    let history: {
      role: "user" | "model";
      parts: { text: string }[];
    }[] = [];

    if (conversationId) {
      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      history = messages.reverse().map((message) => ({
        role: message.role === "USER" ? "user" : "model",
        parts: [{ text: message.content }],
      }));
    }

    // Adiciona a mensagem atual
    history.push({
      role: "user",
      parts: [{ text: data.message }],
    });

    // Pesquisa na base de conhecimento
    const knowledgeResults = this.knowledgeBase.search(data.message);

    const knowledgeContext =
      knowledgeResults.length > 0
        ? knowledgeResults
            .map((item) => {
              return `Título: ${item.title}\nInformação: ${item.content}`;
            })
            .join("\n\n")
        : "Nenhuma informação relevante foi encontrada na base de conhecimento.";

    // Solicita uma resposta ao Gemini e disponibiliza as ferramentas
    const response = await this.geminiService.generateResponse(
      history,
      knowledgeContext,

      async (functionName, args) => {
        // 1. Listar requerimentos do aluno
        if (functionName === "listar_meus_requerimentos") {
          const requerimentos = await this.prisma.requerimento.findMany({
            where: {
              userId,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
            select: {
              protocolo: true,
              tipo: true,
              descricao: true,
              status: true,
              createdAt: true,
            },
          });

          return {
            total: requerimentos.length,
            requerimentos: requerimentos.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
            })),
          };
        }

        // 2. Consultar requerimento pelo protocolo
        if (functionName === "consultar_status_requerimento") {
          const protocolo = args.protocolo;

          // Valida o protocolo recebido do Gemini
          if (
            typeof protocolo !== "string" ||
            protocolo.trim().length < 5 ||
            protocolo.trim().length > 50
          ) {
            return {
              encontrado: false,
              mensagem: "O protocolo informado é inválido.",
            };
          }

          const requerimento = await this.prisma.requerimento.findFirst({
            where: {
              protocolo: protocolo.trim(),
              userId,
            },
            select: {
              protocolo: true,
              tipo: true,
              descricao: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (!requerimento) {
            return {
              encontrado: false,
              mensagem:
                "Nenhum requerimento foi encontrado com esse protocolo.",
            };
          }

          return {
            encontrado: true,
            requerimento: {
              ...requerimento,
              createdAt: requerimento.createdAt.toISOString(),
              updatedAt: requerimento.updatedAt.toISOString(),
            },
          };
        }

        throw new Error(`Ferramenta não permitida: ${functionName}`);
      },
    );

    // Cria uma conversa se for a primeira mensagem
    if (!conversationId) {
      const conversation = await this.prisma.conversation.create({
        data: {
          userId,
          titulo: data.message.slice(0, 60),
        },
      });

      conversationId = conversation.id;
    }

    // Salva as mensagens e atualiza a conversa
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          content: data.message,
          role: "USER",
          conversationId,
        },
      }),

      this.prisma.message.create({
        data: {
          content: response,
          role: "ASSISTANT",
          conversationId,
        },
      }),

      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return {
      conversationId,
      userMessage: data.message,
      assistantMessage: response,
    };
  }
}
