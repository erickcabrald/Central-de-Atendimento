import type { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service.js";

export class UserController {
  private userService: UserService;

  constructor(prisma: ConstructorParameters<typeof UserService>[0]) {
    this.userService = new UserService(prisma);
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = await this.userService.findById(request.user.sub);

    if (!user) {
      return reply.status(404).send({
        message: "Usuário não encontrado.",
      });
    }

    return reply.send({ user });
  }
}
