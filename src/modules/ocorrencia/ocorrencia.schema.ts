import { z } from "zod";

export const createOcorrenciaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, "O título deve ter pelo menos 5 caracteres.")
    .max(100, "O título deve ter no máximo 100 caracteres."),

  descricao: z
    .string()
    .trim()
    .min(10, "A descrição deve ter pelo menos 10 caracteres.")
    .max(2000, "A descrição deve ter no máximo 2000 caracteres."),

  tipo: z.enum([
    "ACADEMICO",
    "ATENDIMENTO",
    "INFRAESTRUTURA",
    "SISTEMA",
    "OUTRO",
  ]),
});

export const updateOcorrenciaStatusSchema = z.object({
  status: z.enum(["ABERTA", "EM_ANDAMENTO", "RESOLVIDA"]),
});

export const ocorrenciaIdSchema = z.string().uuid();

export type CreateOcorrenciaInput = z.infer<typeof createOcorrenciaSchema>;

export type UpdateOcorrenciaStatusInput = z.infer<
  typeof updateOcorrenciaStatusSchema
>;
