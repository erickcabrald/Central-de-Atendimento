import { z } from "zod";

export const searchKnowledgeSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Digite pelo menos 2 caracteres.")
    .max(150, "A pesquisa deve ter no máximo 150 caracteres."),
});
