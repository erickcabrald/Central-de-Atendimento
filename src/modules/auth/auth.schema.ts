import { z } from "zod";

export const registerSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  matricula: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe sua senha."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
