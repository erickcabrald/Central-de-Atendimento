import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

import { RequerimentoController } from "./requerimento.controller.js";

const requerimentoRoutes: FastifyPluginAsync = async (app) => {
  const controller = new RequerimentoController(app.prisma);

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        message: "Não autorizado. Faça login novamente.",
      });
    }
  };

  const adminOnly = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user.role !== "ADMIN") {
      return reply.status(403).send({
        message: "Acesso permitido somente para administradores.",
      });
    }
  };

  app.post("/", { preHandler: authenticate }, (request, reply) =>
    controller.create(request, reply),
  );

  app.get("/", { preHandler: authenticate }, (request, reply) =>
    controller.findAll(request, reply),
  );
  app.get<{ Params: { protocolo: string } }>(
    "/:protocolo",
    { preHandler: authenticate },
    (request, reply) => controller.findByProtocol(request, reply),
  );

  app.patch<{ Params: { id: string } }>(
    "/:id/status",
    { preHandler: [authenticate, adminOnly] },
    (request, reply) => controller.updateStatus(request, reply),
  );
};

export default requerimentoRoutes;
