import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

import { OcorrenciaController } from "./ocorrencia.controller.js";

const ocorrenciaRoutes: FastifyPluginAsync = async (app) => {
  const controller = new OcorrenciaController(app.prisma);

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

  // Criar ocorrência
  app.post("/", { preHandler: authenticate }, (request, reply) =>
    controller.create(request, reply),
  );

  // Listar ocorrências
  app.get("/", { preHandler: authenticate }, (request, reply) =>
    controller.findAll(request, reply),
  );

  // Consultar ocorrência pelo ID
  app.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: authenticate },
    (request, reply) => controller.findById(request, reply),
  );

  // Atualizar status (somente administrador)
  app.patch<{ Params: { id: string } }>(
    "/:id/status",
    { preHandler: [authenticate, adminOnly] },
    (request, reply) => controller.updateStatus(request, reply),
  );
};

export default ocorrenciaRoutes;
