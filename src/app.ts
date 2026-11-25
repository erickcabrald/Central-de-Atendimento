import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { env } from "./generated/config/env.js";
import { prisma } from "./lib/prisma.js";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import requerimentoRoutes from "./modules/requerimento/requerimento.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Prisma
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  // CORS
  await app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/user" });
  await app.register(chatRoutes, { prefix: "/chat" });
  await app.register(requerimentoRoutes, {
    prefix: "/requerimentos",
  });

  // Tratamento global de erros
  app.setErrorHandler((error: any, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode ?? 500;

    return reply.status(statusCode).send({
      statusCode,
      message: statusCode >= 500 ? "Erro interno do servidor." : error.message,
    });
  });

  // Verificação da API
  app.get("/health", async (request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;

      return {
        status: "ok",
        message: "API do Portal CEUMA funcionando.",
        database: "connected",
      };
    } catch (error) {
      request.log.error(error);

      return reply.status(503).send({
        status: "error",
        message: "Não foi possível conectar ao banco de dados.",
        database: "disconnected",
      });
    }
  });

  return app;
}
