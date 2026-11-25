import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(3333),

  DATABASE_URL: z.string().min(1),

  DIRECT_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),

  FRONTEND_URL: z.string().url(),

  GEMINI_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
