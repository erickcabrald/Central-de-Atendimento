import type { FastifyReply, FastifyRequest } from "fastify";
import { RequerimentoService } from "./requerimento.service.js";
import {
  createRequerimentoSchema,
  updateStatusSchema,
} from "./requerimento.schema.js";

export class RequerimentoController {
  private requerimentoService: RequerimentoService;

  constructor(prisma: ConstructorParameters<typeof RequerimentoService>[0]) {
    this.requerimentoService = new RequerimentoService(prisma);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const validation = createRequerimentoSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        message: "Dados inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const requerimento = await this.requerimentoService.create(
      request.user.sub,
      validation.data,
    );

    return reply.status(201).send({
      message: "Requerimento criado com sucesso.",
      data: requerimento,
    });
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const requerimentos = await this.requerimentoService.findAll(
      request.user.sub,
    );

    return reply.send({ data: requerimentos });
  }

  async findByProtocol(
    request: FastifyRequest<{ Params: { protocolo: string } }>,
    reply: FastifyReply,
  ) {
    const requerimento = await this.requerimentoService.findByProtocol(
      request.user.sub,
      request.params.protocolo,
    );

    if (!requerimento) {
      return reply.status(404).send({
        message: "Requerimento não encontrado.",
      });
    }

    return reply.send({ data: requerimento });
  }

  async updateStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const idValidation = (await import("zod")).z
      .string()
      .uuid()
      .safeParse(request.params.id);

    if (!idValidation.success) {
      return reply.status(400).send({
        message: "ID do requerimento inválido.",
      });
    }

    const validation = updateStatusSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        message: "Status inválido.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const requerimento = await this.requerimentoService.updateStatus(
      request.params.id,
      validation.data,
    );

    return reply.send({
      message: "Status atualizado com sucesso.",
      data: requerimento,
    });
  }
}
