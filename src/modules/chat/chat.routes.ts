import type { FastifyPluginAsync } from "fastify";
import { ChatController } from "./chat.controller.js";

const chatRoutes: FastifyPluginAsync = async (app) => {
  const chatController = new ChatController(app.prisma);

  app.post(
    "/message",
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch {
          return reply.status(401).send({
            message: "Não autorizado. Faça login novamente.",
          });
        }
      },
    },
    (request, reply) => chatController.sendMessage(request, reply),
  );
};

export default chatRoutes;
