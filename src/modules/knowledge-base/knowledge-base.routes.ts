import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

import { KnowledgeBaseController } from "./knowledge-base.controller.js";

const knowledgeBaseRoutes: FastifyPluginAsync = async (app) => {
  const controller = new KnowledgeBaseController();

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        message: "Não autorizado. Faça login novamente.",
      });
    }
  };

  app.get<{ Querystring: { q: string } }>(
    "/search",
    {
      preHandler: authenticate,
    },
    (request, reply) => controller.search(request, reply),
  );
};

export default knowledgeBaseRoutes;
