import type { FastifyReply, FastifyRequest } from "fastify";

import { KnowledgeBaseService } from "./knowledge-base.service.js";
import { searchKnowledgeSchema } from "./knowledge-base.schema.js";

export class KnowledgeBaseController {
  private service: KnowledgeBaseService;

  constructor() {
    this.service = new KnowledgeBaseService();
  }

  search(
    request: FastifyRequest<{ Querystring: { q: string } }>,
    reply: FastifyReply,
  ) {
    const result = searchKnowledgeSchema.safeParse(request.query);

    if (!result.success) {
      return reply.status(400).send({
        message: "Pesquisa inválida.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const results = this.service.search(result.data.q);

    return reply.send({
      query: result.data.q,
      total: results.length,
      results,
    });
  }
}
