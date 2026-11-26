import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "../../generated/prisma/client.js";

import { OcorrenciaService } from "./ocorrencia.service.js";

import {
  createOcorrenciaSchema,
  updateOcorrenciaStatusSchema,
  ocorrenciaIdSchema,
} from "./ocorrencia.schema.js";

export class OcorrenciaController {
  private service: OcorrenciaService;

  constructor(prisma: PrismaClient) {
    this.service = new OcorrenciaService(prisma);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const result = createOcorrenciaSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: "Dados inválidos.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const ocorrencia = await this.service.create(request.user.sub, result.data);

    return reply.status(201).send(ocorrencia);
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const ocorrencias = await this.service.findAll(
      request.user.sub,
      request.user.role === "ADMIN",
    );

    return reply.send(ocorrencias);
  }

  async findById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const idResult = ocorrenciaIdSchema.safeParse(request.params.id);

    if (!idResult.success) {
      return reply.status(400).send({
        message: "ID de ocorrência inválido.",
      });
    }

    const ocorrencia = await this.service.findById(
      idResult.data,
      request.user.sub,
      request.user.role === "ADMIN",
    );

    if (!ocorrencia) {
      return reply.status(404).send({
        message: "Ocorrência não encontrada.",
      });
    }

    return reply.send(ocorrencia);
  }

  async updateStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const idResult = ocorrenciaIdSchema.safeParse(request.params.id);

    if (!idResult.success) {
      return reply.status(400).send({
        message: "ID de ocorrência inválido.",
      });
    }

    const result = updateOcorrenciaStatusSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: "Status inválido.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const ocorrencia = await this.service.updateStatus(
      idResult.data,
      result.data,
    );

    if (!ocorrencia) {
      return reply.status(404).send({
        message: "Ocorrência não encontrada.",
      });
    }

    return reply.send(ocorrencia);
  }
}
