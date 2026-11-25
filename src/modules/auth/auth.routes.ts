import type { FastifyPluginAsync } from "fastify";
import { AuthController } from "./auth.controller.js";

const authRoutes: FastifyPluginAsync = async (app) => {
  const authController = new AuthController(app.prisma);

  app.post("/register", (request, reply) =>
    authController.register(request, reply),
  );

  app.post("/login", (request, reply) => authController.login(request, reply));
};

export default authRoutes;
