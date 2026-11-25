# Central de Atendimento Digital

Sistema de atendimento acadêmico desenvolvido para facilitar a comunicação entre alunos e a instituição de ensino, permitindo consultar informações, esclarecer dúvidas e acompanhar solicitações por meio de um chatbot inteligente.

O projeto tem como principal diferencial o **Ceuminha**, um assistente virtual integrado à API do Google Gemini, que busca tornar o atendimento acadêmico mais acessível, rápido e organizado.

## Sobre o projeto

A Central de Atendimento Digital surgiu com o objetivo de reduzir a necessidade de atendimento presencial para resolver dúvidas e acompanhar processos acadêmicos.

Por meio de uma plataforma independente, o aluno poderá interagir com o chatbot, obter orientações sobre procedimentos institucionais, registrar requerimentos e acompanhar o andamento de suas solicitações.

## Funcionalidades

### Implementadas

- [x] Cadastro de usuários.
- [x] Autenticação com e-mail e senha.
- [x] Criptografia de senhas com bcrypt.
- [x] Autenticação e autorização utilizando JWT.
- [x] Consulta dos dados do usuário autenticado.
- [x] Integração com a API do Google Gemini.
- [x] Chatbot Ceuminha com histórico de conversas.
- [x] Armazenamento das conversas e mensagens no banco de dados.
- [x] Isolamento das conversas por usuário.
- [x] Endpoint de verificação de saúde da aplicação.

### Em desenvolvimento

- [ ] Criação e gerenciamento de requerimentos.
- [ ] Geração de protocolos para solicitações.
- [ ] Consulta do andamento dos requerimentos.
- [ ] Atualização de status por administradores.
- [ ] Registro e acompanhamento de ocorrências.
- [ ] Base de conhecimento institucional para o chatbot.
- [ ] Integração do chatbot com funcionalidades do sistema por Function Calling.
- [ ] Consultas de informações acadêmicas, como notas, faltas e horários.

## Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| Node.js | Ambiente de execução |
| TypeScript | Linguagem de programação |
| Fastify | Framework para construção da API |
| Prisma ORM | Comunicação com o banco de dados |
| Supabase | Banco de dados PostgreSQL |
| PostgreSQL | Banco de dados relacional |
| Zod | Validação de dados |
| JWT | Autenticação |
| bcryptjs | Criptografia de senhas |
| Google Gemini | Inteligência artificial do chatbot |
| pnpm | Gerenciador de pacotes |

## Arquitetura do projeto

O backend utiliza uma arquitetura modular, separando as responsabilidades de rotas, controllers e services.

```text
Central-Atendimento/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── chat/
│   │   ├── requerimento/
│   │   ├── ocorrencia/
│   │   └── knowledge-base/
│   ├── plugins/
│   ├── config/
│   │   └── env.ts
│   ├── lib/
│   │   └── prisma.ts
│   ├── types/
│   │   └── fastify.d.ts
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── prisma7.config.ts
└── tsconfig.json
```

### Organização dos módulos

Cada módulo possui responsabilidades específicas:

- **Auth:** cadastro, login e autenticação dos usuários.
- **User:** gerenciamento e consulta dos dados dos usuários.
- **Chat:** gerenciamento das conversas e integração com o Gemini.
- **Requerimento:** criação, consulta e atualização de solicitações acadêmicas.
- **Ocorrência:** registro e acompanhamento de ocorrências.
- **Knowledge Base:** organização das informações institucionais utilizadas pelo chatbot.

O fluxo de processamento segue o padrão:

```text
Routes → Controller → Service → Prisma → Database
```

## Como executar o projeto

### Pré-requisitos

Antes de começar, você precisará ter instalado:

- Node.js (versão 22 ou superior).
- pnpm.
- Uma instância PostgreSQL, como o banco disponibilizado pelo Supabase.
- Uma chave de API do Google Gemini.

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/Central-Atendimento.git

cd Central-Atendimento
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3333
NODE_ENV=development

DATABASE_URL="SUA_DATABASE_URL"
DIRECT_URL="SUA_DIRECT_URL"

JWT_SECRET="SUA_CHAVE_SECRETA"

FRONTEND_URL="http://localhost:5173"

GEMINI_API_KEY="SUA_CHAVE_GEMINI"
```

**Descrição das variáveis:**

| Variável | Descrição |
|---|---|
| PORT | Porta utilizada pelo servidor |
| NODE_ENV | Ambiente de execução |
| DATABASE_URL | URL de conexão com o PostgreSQL |
| DIRECT_URL | Conexão direta utilizada pelo Prisma |
| JWT_SECRET | Chave secreta para assinatura dos tokens JWT |
| FRONTEND_URL | Endereço permitido para acesso via CORS |
| GEMINI_API_KEY | Chave de acesso à API do Google Gemini |

> Nunca compartilhe seu arquivo `.env` ou envie suas chaves secretas para o GitHub.

### 4. Execute as migrações

```bash
pnpm exec prisma migrate dev
```

Gere o Prisma Client:

```bash
pnpm exec prisma generate
```

### 5. Inicie o servidor

Para executar em ambiente de desenvolvimento:

```bash
pnpm dev
```

O servidor estará disponível em:

```text
http://localhost:3333
```

## Endpoints da API

Os endpoints abaixo representam as rotas implementadas e planejadas para o projeto.

### Autenticação

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/auth/register` | Cadastro de usuário | Público |
| POST | `/auth/login` | Login do usuário | Público |
| GET | `/user/me` | Consulta dos dados do usuário autenticado | Autenticado |

### Chatbot

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/chat/message` | Envia uma mensagem ao Ceuminha | Autenticado |

### Requerimentos

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/requerimentos` | Cria um requerimento | Aluno |
| GET | `/requerimentos` | Lista os requerimentos do usuário | Autenticado |
| GET | `/requerimentos/:protocolo` | Consulta um requerimento pelo protocolo | Autenticado |
| PATCH | `/requerimentos/:id/status` | Atualiza o status de um requerimento | Administrador |

*Os endpoints de requerimentos estão em desenvolvimento e ainda precisam ser validados.*

## Chatbot Ceuminha

O Ceuminha é o assistente virtual da plataforma e utiliza o modelo Gemini para interpretar e responder às mensagens dos alunos.

Atualmente, o chatbot possui:

- Integração com o Google Gemini.
- Instruções de comportamento específicas para o contexto acadêmico.
- Histórico de conversas armazenado no PostgreSQL.
- Associação das conversas ao usuário autenticado.
- Recuperação das mensagens anteriores para manter o contexto da conversa.

A evolução do chatbot prevê a utilização de Function Calling, permitindo que a inteligência artificial solicite operações específicas ao backend, como consultar requerimentos e registrar solicitações.

As operações serão executadas e validadas pelo backend, garantindo que o usuário só tenha acesso às próprias informações.

## Segurança

O projeto utiliza algumas medidas para proteger os dados e controlar o acesso às funcionalidades:

- Senhas armazenadas utilizando hash com bcrypt.
- Autenticação baseada em JWT.
- Rotas protegidas por autenticação.
- Controle de permissões por perfil de usuário (`ALUNO` e `ADMIN`).
- Validação de dados de entrada com Zod.
- Isolamento dos dados de acordo com o usuário autenticado.
- Variáveis sensíveis armazenadas em arquivos de ambiente.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia o servidor em desenvolvimento |
| `pnpm build` | Compila o projeto TypeScript |
| `pnpm start` | Executa a versão compilada |
| `pnpm typecheck` | Verifica os tipos TypeScript |
| `pnpm exec prisma generate` | Gera o Prisma Client |
| `pnpm exec prisma migrate dev` | Executa as migrações |

## Objetivo do projeto

A Central de Atendimento Digital busca modernizar o atendimento acadêmico, proporcionando aos alunos uma maneira mais prática de esclarecer dúvidas, solicitar serviços e acompanhar processos institucionais.

Além de facilitar o acesso às informações, o projeto explora a aplicação de inteligência artificial integrada a uma API backend para automatizar parte das interações entre alunos e instituição.

---

**Projeto acadêmico — UniCEUMA**

Desenvolvido como uma proposta de solução para melhorar a experiência de atendimento dos alunos.