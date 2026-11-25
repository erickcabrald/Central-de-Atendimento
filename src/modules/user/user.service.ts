import type { PrismaClient } from "../../generated/prisma/client.js";

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        matricula: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
