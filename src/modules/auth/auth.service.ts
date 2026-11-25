import bcrypt from "bcryptjs";
import type { RegisterInput, LoginInput } from "./auth.schema.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterInput) {
    const email = data.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return null;
    }

    if (data.matricula) {
      const existingMatricula = await this.prisma.user.findUnique({
        where: { matricula: data.matricula },
      });

      if (existingMatricula) {
        return null;
      }
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    const user = await this.prisma.user.create({
      data: {
        nome: data.nome,
        email,
        senha: senhaHash,
        matricula: data.matricula || null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        matricula: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const email = data.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(data.senha, user.senha);

    if (!passwordMatch) {
      return null;
    }

    const { senha, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
