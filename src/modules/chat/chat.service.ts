import type { PrismaClient } from "../../generated/prisma/client.js";
import { GeminiService } from "./gemini.service.js";
import type { SendMessageInput } from "./chat.schema.js";

export class ChatService {
  private geminiService = new GeminiService();

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

    // Recupera o histórico da conversa
    let history: {
      role: "user" | "model";
      parts: { text: string }[];
    }[] = [];

    if (conversationId) {
      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      history = messages.map((message) => ({
        role: message.role === "USER" ? "user" : "model",
        parts: [{ text: message.content }],
      }));
    }

    // Adiciona a mensagem atual
    history.push({
      role: "user",
      parts: [{ text: data.message }],
    });

    // Solicita uma resposta ao Gemini
    const response = await this.geminiService.generateResponse(history);

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

    // Salva a mensagem do aluno e a resposta do assistente
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
