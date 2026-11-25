import { z } from "zod";

export const createRequerimentoSchema = z.object({
  tipo: z.enum([
    "RECEBIMENTO_PROVA",
    "APROVEITAMENTO_ESTUDOS",
    "TRANCAMENTO",
    "OUTRO",
  ]),
  descricao: z
    .string()
    .trim()
    .min(10, "A descrição deve ter pelo menos 10 caracteres.")
    .max(2000, "A descrição deve ter no máximo 2000 caracteres."),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ABERTO", "EM_ANALISE", "DEFERIDO", "INDEFERIDO"]),
});

export type CreateRequerimentoInput = z.infer<typeof createRequerimentoSchema>;

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export const requerimentoIdSchema = z.string().uuid();
