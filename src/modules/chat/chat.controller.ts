import type { FastifyReply, FastifyRequest } from "fastify";
import { ChatService } from "./chat.service.js";
import { sendMessageSchema } from "./chat.schema.js";

export class ChatController {
  private chatService: ChatService;

  constructor(prisma: ConstructorParameters<typeof ChatService>[0]) {
    this.chatService = new ChatService(prisma);
  }

  async sendMessage(request: FastifyRequest, reply: FastifyReply) {
    const validation = sendMessageSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        message: "Dados inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = await this.chatService.sendMessage(
      request.user.sub,
      validation.data,
    );

    if (!result) {
      return reply.status(404).send({
        message: "Conversa não encontrada.",
      });
    }

    return reply.status(200).send({
      message: "Mensagem enviada com sucesso.",
      data: result,
    });
  }
}
