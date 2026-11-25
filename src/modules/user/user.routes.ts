import type { FastifyPluginAsync } from "fastify";
import { UserController } from "./user.controller.js";

const userRoutes: FastifyPluginAsync = async (app) => {
  const userController = new UserController(app.prisma);

  app.get(
    "/me",
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
    (request, reply) => userController.me(request, reply),
  );
};

export default userRoutes;
