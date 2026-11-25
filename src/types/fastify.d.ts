import "fastify";
import "@fastify/jwt";
import type { PrismaClient } from "../generated/prisma/client.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: "ALUNO" | "ADMIN";
    };

    user: {
      sub: string;
      role: "ALUNO" | "ADMIN";
    };
  }
}
