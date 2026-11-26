export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

export const knowledgeBase: KnowledgeItem[] = [
  {
    id: "aproveitamento-estudos",
    title: "Aproveitamento de estudos",
    content:
      "O aproveitamento de estudos permite solicitar a análise de disciplinas cursadas anteriormente em outra instituição ou curso. O aluno deve consultar a secretaria acadêmica para verificar os documentos exigidos, os critérios de análise e os procedimentos para realizar a solicitação. A aprovação depende da avaliação institucional.",
    keywords: [
      "aproveitamento",
      "disciplinas",
      "estudos",
      "equivalencia",
      "materias",
      "historico",
    ],
  },
  {
    id: "trancamento",
    title: "Trancamento de matrícula",
    content:
      "O trancamento de matrícula é um procedimento acadêmico utilizado quando o aluno deseja interromper temporariamente seus estudos. Para solicitar, o aluno deve consultar a secretaria acadêmica sobre as regras, os prazos, os possíveis efeitos financeiros e as condições para retorno.",
    keywords: [
      "trancamento",
      "trancar",
      "matricula",
      "interromper",
      "pausar",
      "retorno",
    ],
  },
  {
    id: "recebimento-prova",
    title: "Recebimento de prova",
    content:
      "O recebimento de prova é um tipo de requerimento acadêmico relacionado à solicitação ou ao recebimento de avaliações. O aluno deve verificar com a secretaria ou coordenação responsável as condições, os procedimentos e os documentos necessários para seu caso.",
    keywords: [
      "prova",
      "avaliacao",
      "recebimento",
      "segunda chamada",
      "secretaria",
    ],
  },
  {
    id: "requerimentos",
    title: "Solicitação de requerimentos",
    content:
      "Os requerimentos são solicitações formais realizadas pelo aluno para tratar de assuntos acadêmicos ou administrativos. Na Central de Atendimento Digital, o aluno pode registrar uma solicitação e acompanhar seu andamento por meio do protocolo gerado pelo sistema.",
    keywords: [
      "requerimento",
      "solicitacao",
      "protocolo",
      "acompanhar",
      "pedido",
      "status",
    ],
  },
  {
    id: "ocorrencias",
    title: "Registro de ocorrências",
    content:
      "O aluno pode registrar ocorrências para comunicar problemas relacionados ao atendimento, questões acadêmicas, infraestrutura ou sistemas. Após o registro, poderá acompanhar o andamento da ocorrência pela plataforma.",
    keywords: [
      "ocorrencia",
      "problema",
      "reclamacao",
      "atendimento",
      "infraestrutura",
      "sistema",
    ],
  },
];
