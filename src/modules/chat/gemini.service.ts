import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "v1beta",
  },
});

const SYSTEM_INSTRUCTION = `
Você é o Ceuminha, assistente virtual do Portal do Aluno CEUMA.

Seu objetivo é ajudar os alunos com dúvidas sobre:
- Serviços acadêmicos;
- Matrícula;
- Notas e faltas;
- Requerimentos;
- Ocorrências;
- Atividades complementares;
- Informações sobre a instituição.

Regras:
1. Seja educado, claro e objetivo.
2. Responda sempre em português brasileiro.
3. Utilize uma linguagem simples e acolhedora.
4. Não invente regras, prazos, valores ou informações institucionais.
5. Quando não souber uma informação, deixe isso claro.
6. Não afirme que realizou uma consulta ou ação no sistema.
7. Explique que consultas individuais e solicitações acadêmicas
   serão disponibilizadas pelo portal quando necessário.

Você ainda não possui acesso aos dados acadêmicos dos alunos.
`;

type ChatHistory = {
  role: "user" | "model";
  parts: { text: string }[];
};

export class GeminiService {
  async generateResponse(history: ChatHistory[]) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("O Gemini não retornou uma resposta.");
    }

    return text;
  }
}
