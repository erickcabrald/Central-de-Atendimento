import type { PrismaClient } from "../../generated/prisma/client.js";

import type {
  CreateOcorrenciaInput,
  UpdateOcorrenciaStatusInput,
} from "./ocorrencia.schema.js";

export class OcorrenciaService {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, data: CreateOcorrenciaInput) {
    return this.prisma.ocorrencia.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        userId,
      },
    });
  }

  async findAll(userId: string, isAdmin: boolean) {
    return this.prisma.ocorrencia.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string, userId: string, isAdmin: boolean) {
    return this.prisma.ocorrencia.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { userId }),
      },
    });
  }

  async updateStatus(id: string, data: UpdateOcorrenciaStatusInput) {
    const ocorrencia = await this.prisma.ocorrencia.findUnique({
      where: { id },
    });

    if (!ocorrencia) {
      return null;
    }

    return this.prisma.ocorrencia.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }
}
