import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client.js";

import { GeminiService } from "./gemini.service.js";
import type { SendMessageInput } from "./chat.schema.js";

import { KnowledgeBaseService } from "../knowledge-base/knowledge-base.service.js";

const TIPOS_REQUERIMENTO = [
  "RECEBIMENTO_PROVA",
  "APROVEITAMENTO_ESTUDOS",
  "TRANCAMENTO",
  "OUTRO",
] as const;

const TIPOS_OCORRENCIA = [
  "ACADEMICO",
  "ATENDIMENTO",
  "INFRAESTRUTURA",
  "SISTEMA",
  "OUTRO",
] as const;

type OcorrenciaTipoValido = (typeof TIPOS_OCORRENCIA)[number];

function isTipoOcorrencia(value: unknown): value is OcorrenciaTipoValido {
  return (
    typeof value === "string" &&
    TIPOS_OCORRENCIA.includes(value as OcorrenciaTipoValido)
  );
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

type RequerimentoTipoValido = (typeof TIPOS_REQUERIMENTO)[number];

function isTipoRequerimento(value: unknown): value is RequerimentoTipoValido {
  return (
    typeof value === "string" &&
    TIPOS_REQUERIMENTO.includes(value as RequerimentoTipoValido)
  );
}

function normalizeConfirmationMessage(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExplicitConfirmation(message: string): boolean {
  const normalized = normalizeConfirmationMessage(message);

  return [
    "sim",
    "s",
    "confirmo",
    "confirmado",
    "pode confirmar",
    "sim pode confirmar",
    "pode criar",
    "sim pode criar",
    "pode registrar",
    "sim pode registrar",
    "desejo confirmar",
    "quero confirmar",
    "pode prosseguir",
    "isso mesmo",
    "esta correto",
    "esta certo",
  ].includes(normalized);
}

function isExplicitCancellation(message: string): boolean {
  const normalized = normalizeConfirmationMessage(message);

  return [
    "nao",
    "cancela",
    "cancelar",
    "quero cancelar",
    "nao quero",
    "nao pode confirmar",
    "desisto",
    "pode cancelar",
    "nao pode criar",
  ].includes(normalized);
}

export class ChatService {
  private geminiService = new GeminiService();
  private knowledgeBase = new KnowledgeBaseService();

  constructor(private prisma: PrismaClient) {}

  async sendMessage(userId: string, data: SendMessageInput) {
    let conversationId: string;

    // Verifica se a conversa pertence ao usuário.
    if (data.conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: data.conversationId,
          userId,
        },
      });

      if (!conversation) {
        return null;
      }

      conversationId = conversation.id;
    } else {
      // Cria a conversa antes do Gemini para que as ferramentas
      // possam guardar informações nela durante a execução.
      const conversation = await this.prisma.conversation.create({
        data: {
          userId,
          titulo: data.message.slice(0, 60),
        },
      });

      conversationId = conversation.id;
    }

    // Recupera as 20 mensagens mais recentes.
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const history = messages.reverse().map((message) => ({
      role: message.role === "USER" ? ("user" as const) : ("model" as const),
      parts: [{ text: message.content }],
    }));

    // Guarda a última resposta do assistente para validar
    // se o aluno realmente estava respondendo a uma confirmação.
    const lastAssistantMessage = [...history]
      .reverse()
      .find((message) => message.role === "model")?.parts[0]?.text;

    // Adiciona a mensagem atual.
    history.push({
      role: "user",
      parts: [{ text: data.message }],
    });

    // Pesquisa na Base de Conhecimento.

    // Pesquisa na Base de Conhecimento usando busca semântica.
    const knowledgeResults = await this.knowledgeBase.search(data.message);

    const knowledgeContext =
      knowledgeResults.length > 0
        ? knowledgeResults
            .map((item, index) => {
              return `
Trecho ${index + 1}
Documento: ${item.title}
Relevância: ${(item.similarity * 100).toFixed(2)}%
Informação: ${item.content}
`;
            })
            .join("\n")
        : "Nenhuma informação relevante foi encontrada na base de conhecimento.";

    // Solicita resposta ao Gemini e disponibiliza as ferramentas.
    const response = await this.geminiService.generateResponse(
      history,
      knowledgeContext,

      async (functionName, args) => {
        // 1. Listar requerimentos do aluno.
        if (functionName === "listar_meus_requerimentos") {
          const requerimentos = await this.prisma.requerimento.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
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

        // 2. Consultar requerimento pelo protocolo.
        if (functionName === "consultar_status_requerimento") {
          const protocolo = args.protocolo;

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

        // 3. Preparar requerimento, sem criar o registro definitivo.
        if (functionName === "preparar_requerimento") {
          const tipo = args.tipo;
          const descricao = args.descricao;

          if (!isTipoRequerimento(tipo)) {
            return {
              sucesso: false,
              mensagem: "O tipo de requerimento informado é inválido.",
            };
          }

          if (
            typeof descricao !== "string" ||
            descricao.trim().length < 5 ||
            descricao.trim().length > 3000
          ) {
            return {
              sucesso: false,
              mensagem: "A descrição deve ter entre 5 e 3000 caracteres.",
            };
          }

          const conversation = await this.prisma.conversation.findFirst({
            where: {
              id: conversationId,
              userId,
            },
            select: {
              requerimentoPendenteTipo: true,
              requerimentoPendenteDescricao: true,
            },
          });

          if (!conversation) {
            return {
              sucesso: false,
              mensagem: "Não foi possível localizar a conversa.",
            };
          }

          if (
            conversation.requerimentoPendenteTipo ||
            conversation.requerimentoPendenteDescricao
          ) {
            return {
              sucesso: false,
              mensagem:
                "Já existe um requerimento aguardando confirmação nesta conversa. Peça ao aluno para confirmar ou cancelar antes de preparar outro.",
            };
          }

          await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
              requerimentoPendenteTipo: tipo,
              requerimentoPendenteDescricao: descricao.trim(),
            },
          });

          return {
            sucesso: true,
            preparado: true,
            tipo,
            descricao: descricao.trim(),
            mensagem:
              "Requerimento preparado, mas ainda não criado. Apresente o resumo ao aluno e solicite confirmação explícita.",
          };
        }

        // 4. Confirmar e criar o requerimento.
        if (functionName === "confirmar_requerimento") {
          const conversation = await this.prisma.conversation.findFirst({
            where: {
              id: conversationId,
              userId,
            },
            select: {
              requerimentoPendenteTipo: true,
              requerimentoPendenteDescricao: true,
            },
          });

          if (
            !conversation?.requerimentoPendenteTipo ||
            !conversation.requerimentoPendenteDescricao
          ) {
            return {
              sucesso: false,
              criado: false,
              mensagem: "Não existe requerimento pendente para confirmar.",
            };
          }

          const assistantAskedConfirmation =
            typeof lastAssistantMessage === "string" &&
            /confirm|deseja registrar|deseja criar/i.test(lastAssistantMessage);

          if (
            !assistantAskedConfirmation ||
            !isExplicitConfirmation(data.message)
          ) {
            return {
              sucesso: false,
              criado: false,
              mensagem:
                "A confirmação não foi identificada. O requerimento continua pendente. Solicite uma confirmação explícita ao aluno.",
            };
          }

          const protocolo = `REQ-${new Date().getFullYear()}-${randomUUID()
            .slice(0, 8)
            .toUpperCase()}`;

          const requerimento = await this.prisma.$transaction(
            async (transaction) => {
              const created = await transaction.requerimento.create({
                data: {
                  protocolo,
                  tipo: conversation.requerimentoPendenteTipo!,
                  descricao: conversation.requerimentoPendenteDescricao!,
                  userId,
                },
              });

              await transaction.conversation.update({
                where: { id: conversationId },
                data: {
                  requerimentoPendenteTipo: null,
                  requerimentoPendenteDescricao: null,
                },
              });

              return created;
            },
          );

          return {
            sucesso: true,
            criado: true,
            requerimento: {
              protocolo: requerimento.protocolo,
              tipo: requerimento.tipo,
              descricao: requerimento.descricao,
              status: requerimento.status,
              createdAt: requerimento.createdAt.toISOString(),
            },
            mensagem:
              "Requerimento criado com sucesso. Informe ao aluno o protocolo retornado.",
          };
        }

        // 5. Cancelar requerimento pendente.
        if (functionName === "cancelar_requerimento") {
          const conversation = await this.prisma.conversation.findFirst({
            where: {
              id: conversationId,
              userId,
            },
            select: {
              requerimentoPendenteTipo: true,
              requerimentoPendenteDescricao: true,
            },
          });

          if (
            !conversation?.requerimentoPendenteTipo ||
            !conversation.requerimentoPendenteDescricao
          ) {
            return {
              sucesso: false,
              cancelado: false,
              mensagem: "Não existe requerimento pendente para cancelar.",
            };
          }

          const assistantAskedConfirmation =
            typeof lastAssistantMessage === "string" &&
            /confirm|deseja registrar|deseja criar/i.test(lastAssistantMessage);

          if (
            !assistantAskedConfirmation ||
            !isExplicitCancellation(data.message)
          ) {
            return {
              sucesso: false,
              cancelado: false,
              mensagem:
                "O cancelamento não foi identificado. O requerimento continua pendente.",
            };
          }

          await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
              requerimentoPendenteTipo: null,
              requerimentoPendenteDescricao: null,
            },
          });

          return {
            sucesso: true,
            cancelado: true,
            mensagem:
              "A solicitação pendente foi cancelada e nenhum requerimento foi criado.",
          };
        }

        // 6. Registrar ocorrência.
        if (functionName === "registrar_ocorrencia") {
          const titulo = args.titulo;
          const descricao = args.descricao;
          const tipo = args.tipo;

          if (
            typeof titulo !== "string" ||
            titulo.trim().length < 5 ||
            titulo.trim().length > 100
          ) {
            return {
              sucesso: false,
              mensagem: "O título deve ter entre 5 e 100 caracteres.",
            };
          }

          if (
            typeof descricao !== "string" ||
            descricao.trim().length < 10 ||
            descricao.trim().length > 2000
          ) {
            return {
              sucesso: false,
              mensagem: "A descrição deve ter entre 10 e 2000 caracteres.",
            };
          }

          if (!isTipoOcorrencia(tipo)) {
            return {
              sucesso: false,
              mensagem: "O tipo de ocorrência informado é inválido.",
            };
          }

          const ocorrencia = await this.prisma.ocorrencia.create({
            data: {
              titulo: titulo.trim(),
              descricao: descricao.trim(),
              tipo,
              userId,
            },
          });

          return {
            sucesso: true,
            registrada: true,
            ocorrencia: {
              id: ocorrencia.id,
              titulo: ocorrencia.titulo,
              descricao: ocorrencia.descricao,
              tipo: ocorrencia.tipo,
              status: ocorrencia.status,
              createdAt: ocorrencia.createdAt.toISOString(),
            },
            mensagem: "Ocorrência registrada com sucesso.",
          };
        }

        // 7. Listar ocorrências do aluno autenticado.
        if (functionName === "listar_minhas_ocorrencias") {
          const ocorrencias = await this.prisma.ocorrencia.findMany({
            where: { userId },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
            select: {
              id: true,
              titulo: true,
              descricao: true,
              tipo: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return {
            total: ocorrencias.length,
            ocorrencias: ocorrencias.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
            })),
          };
        }

        // 8. Consultar ocorrência pelo ID.
        if (functionName === "consultar_ocorrencia") {
          const id = args.id;

          if (!isUuid(id)) {
            return {
              encontrada: false,
              mensagem: "O ID da ocorrência informado é inválido.",
            };
          }

          const ocorrencia = await this.prisma.ocorrencia.findFirst({
            where: {
              id,
              userId,
            },
            select: {
              id: true,
              titulo: true,
              descricao: true,
              tipo: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (!ocorrencia) {
            return {
              encontrada: false,
              mensagem: "Nenhuma ocorrência foi encontrada com esse ID.",
            };
          }

          return {
            encontrada: true,
            ocorrencia: {
              ...ocorrencia,
              createdAt: ocorrencia.createdAt.toISOString(),
              updatedAt: ocorrencia.updatedAt.toISOString(),
            },
          };
        }

        throw new Error(`Ferramenta não permitida: ${functionName}`);
      },
    );

    // Salva as mensagens e atualiza a conversa.
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
