import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

export class AuthController {
  private authService: AuthService;

  constructor(prisma: ConstructorParameters<typeof AuthService>[0]) {
    this.authService = new AuthService(prisma);
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const validation = registerSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        message: "Dados inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const user = await this.authService.register(validation.data);

    if (!user) {
      return reply.status(409).send({
        message: "E-mail ou matrícula já cadastrados.",
      });
    }

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
    });

    return reply.status(201).send({
      message: "Usuário cadastrado com sucesso.",
      user,
      token,
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const validation = loginSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        message: "Dados inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const user = await this.authService.login(validation.data);

    if (!user) {
      return reply.status(401).send({
        message: "E-mail ou senha incorretos.",
      });
    }

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
    });

    return reply.send({
      message: "Login realizado com sucesso.",
      user,
      token,
    });
  }
}
