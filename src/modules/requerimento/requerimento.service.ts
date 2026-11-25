import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type {
  CreateRequerimentoInput,
  UpdateStatusInput,
} from "./requerimento.schema.js";

export class RequerimentoService {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, data: CreateRequerimentoInput) {
    const protocolo = `REQ-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    return this.prisma.requerimento.create({
      data: {
        protocolo,
        tipo: data.tipo,
        descricao: data.descricao,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.requerimento.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByProtocol(userId: string, protocolo: string) {
    return this.prisma.requerimento.findFirst({
      where: {
        protocolo,
        userId,
      },
    });
  }

  async updateStatus(id: string, data: UpdateStatusInput) {
    const existing = await this.prisma.requerimento.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    return this.prisma.requerimento.update({
      where: { id },
      data: { status: data.status },
    });
  }
}
