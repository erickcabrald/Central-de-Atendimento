import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(4000, "A mensagem deve ter no máximo 4000 caracteres."),

  conversationId: z.string().uuid().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
