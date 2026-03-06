# Stream Server

Servidor híbrido **HTTP + WebSocket** para streaming de tela em tempo real, com geração dinâmica de cliente em **Go** compilado para executável Windows (.exe). Desenvolvido com **Clean Architecture** e **Hexagonal (Ports & Adapters)**, inversão de dependência e deploy em **Docker** (AWS).

---

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e variáveis de ambiente](#configuração-e-variáveis-de-ambiente)
- [Instalação e execução](#instalação-e-execução)
- [Docker](#docker)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Documentação adicional](#documentação-adicional)

---

## Visão geral

O **Stream Server** permite que usuários:

1. **Cadastrem-se e autentiquem-se** (JWT, cookies, verificação por e-mail).
2. **Criem streams** com nome e senha.
3. **Baixem um executável (.exe)** gerado pelo servidor: um cliente em **Go** que captura a tela e envia os frames via WebSocket para o servidor.
4. **Assistam a streams** em tempo real no navegador (visualizadores conectam via WebSocket e recebem os frames).

O servidor expõe:

- **HTTP** (Express): API REST, páginas estáticas, autenticação, CRUD de usuários e streams.
- **WebSocket** (path `/ws`): conexões de clientes de **captura** (Go) e de **visualização** (navegador), com roteamento de mensagens por tipo.

A compilação do cliente Go é feita **no próprio servidor** (use case `CompileGoToExe`): geração de código Go, `go mod tidy`, `go build` para Windows (GOOS=windows, GOARCH=amd64), e download do `.exe` via HTTP.

---

## Funcionalidades

| Área | Descrição |
|------|------------|
| **Usuários** | Registro, login, verificação por e-mail, perfil, listagem e exclusão. |
| **Autenticação** | JWT (access + refresh), cookies httpOnly, refresh de token, verificação de e-mail por link. |
| **Administrador** | Criação de admin a partir de e-mail (`/createAdmin`). |
| **Streams** | Criar stream (nome + senha), listar por usuário, obter ID por nome, excluir. Geração e download do cliente .exe. |
| **WebSocket** | Handshake de cliente de captura (`CAPTURE_CLIENT_CONNECT`) e de visualizador (`CLIENT_CONNECT`), relay de imagens (Base64) do capturador para o visualizador, com validação de senha. |
| **Views** | Páginas HTML estáticas: login, registro, perfil, minhas streams, criar stream, assistir stream. |

---

## Stack tecnológica

- **Runtime:** Node.js 18+
- **Linguagem:** TypeScript, Go
- **Build:** Babel (ESM, TypeScript)
- **HTTP:** Express 5
- **WebSocket:** `ws`
- **Banco de dados:** MongoDB (Mongoose) — abstração permite trocar por MySQL (`IDataAccess`)
- **Autenticação:** JWT (jsonwebtoken), bcrypt, cookies
- **E-mail:** Nodemailer (verificação de conta)
- **Validação:** Zod + builder customizado (DTOs)
- **Cliente de captura:** Go (gerado e compilado pelo servidor), gorilla/websocket, kbinani/screenshot
- **Deploy:** Docker (Node + toolchain Go na imagem), AWS

---

## Pré-requisitos

- Node.js 18+
- npm
- **Para geração do .exe:** Go instalado (usado pelo use case `CompileGoToExe`; no Docker a imagem já inclui Go).
- **Banco:** MongoDB (ou configuração MySQL se usar o adapter correspondente).
- Variáveis de ambiente configuradas (ver abaixo).

---

## Configuração e variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (ou configure no ambiente de produção).

### Banco de dados

| Variável | Descrição |
|----------|-----------|
| `MONGO_URL` | URL de conexão MongoDB (ex.: `mongodb://localhost:27017/streamdb`). |

### JWT e autenticação

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Chave secreta do token de acesso. |
| `JWT_REFRESH_SECRET` | Chave secreta do token de refresh. |
| `JWT_TIME_SET_SECRET` | Chave para token de verificação de e-mail (link). |

### E-mail (verificação de conta)

| Variável | Descrição |
|----------|-----------|
| `EMAIL_HOST` | Host SMTP. |
| `EMAIL_PORT` | Porta SMTP. |
| `EMAIL_SECURE` | `true` ou `false`. |
| `EMAIL_USER` | Usuário SMTP. |
| `EMAIL_PASS` | Senha SMTP. |

### Ambiente

| Variável | Descrição |
|----------|-----------|
| `NODE_ENV` | `development` ou `production` (afeta CORS, cookies secure, mensagens de erro). |

---

## Instalação e execução

```bash
# Instalar dependências
npm install

# Build (TypeScript → dist/)
npm run build

# Executar
npm start
```

O servidor sobe na porta definida em `main.ts` (ex.: `1090`). Em desenvolvimento, pode-se usar `node --loader` ou ferramentas que executem TypeScript diretamente.

### Testes

```bash
npm test
```

Testes com Jest (ex.: `src/test/services/Users.spec.ts`, `src/test/controllers/Users.spec.ts`). Os testes de integração utilizam MongoDB (coleção `users` é limpa no `beforeAll`).

---

## Docker

A imagem Docker inclui **Node 18** e o **toolchain Go** (e dependências para compilação), para que o use case `CompileGoToExe` funcione dentro do container.

```bash
# Build da imagem
docker build -t stream-server .

# Executar (passe MONGO_URL e demais envs)
docker run -p 1090:1090 -e MONGO_URL="..." -e JWT_SECRET="..." ... stream-server
```

O `Dockerfile`:

- Usa `node:18-alpine`.
- Instala Go, gcc, musl-dev e libs (ex.: libx*) para suporte a CGO/dependências do cliente Go.
- Copia `go-mod-template` para o container (usado pelo `CompileGoToExe`).
- Define `CGO_ENABLED=1`.
- Executa `npm run build` e inicia com `node dist/main.js`.

Para produção na AWS, use o mesmo build (ou registry) e configure variáveis de ambiente e rede (VPC, security groups, etc.) conforme seu ambiente.

---

## Estrutura do projeto

```
stream-server/
├── src/
│   ├── main.ts                    # Entrada: instancia AppModule e listen(porta)
│   ├── application/              # Casos de uso e DTOs
│   │   ├── users/                 # UserCreate, LoginUser, GetUserById, etc.
│   │   └── stream/                # CreateStream, CompileGoToExe, GetAllStreams, etc.
│   ├── domain/                    # Entidades e contratos (portas)
│   │   ├── entities/              # UserEntities, StreamEntities
│   │   ├── repository/            # IUserRepository, IDataAccess, IDatabaseHandler
│   │   └── services/              # ICreateId, IPasswordHasher
│   ├── infra/                     # Adaptadores e implementações
│   │   ├── app/                   # App.ts (composição, módulos, graceful shutdown)
│   │   ├── controllers/          # UserController, AuthController, StreamController, AdminController, ViewController
│   │   ├── modules/               # UsersModule, StreamModule, AdminModule, ViewModule
│   │   ├── service/               # UsersService, StreamService, AdminService
│   │   ├── repository/            # UserRepository, StreamRepository, AdminRepository
│   │   ├── server/                # ExpressAdapter, WsWebSocketServerAdapter, interfaces
│   │   ├── handlers/              # WebSocket: ClientVisualizer, CaptureClientConnectHandler, ImageRelayHandler, UnexpectedMessageHandler
│   │   ├── client/                # ClientRegistry (captura + visualizadores)
│   │   ├── database/              # MongooseHandler, MongooseDataAccess, MySqlDataAccess
│   │   ├── security/              # JWT, BcryptPasswordHasher, tokens
│   │   └── email/                 # NodemailerEmailService
│   ├── config/                    # ConfigDB, ConfigEnv, ConfigEmail
│   ├── schemas/                   # UsersSchemas (validação DTO)
│   ├── shared/                    # Validator (Zod), Errors, Utils
│   └── view/                      # Páginas HTML/JS/CSS estáticos
├── go-mod-template/              # go.mod (e go.sum) usados pelo CompileGoToExe
├── Dockerfile
├── package.json
└── docs/                          # Documentação detalhada
    ├── ARCHITECTURE.md
    └── API.md
```

---

## Documentação adicional

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Clean Architecture e Hexagonal: camadas, fluxos, dependências e decisões.
- **[docs/API.md](docs/API.md)** — Referência da API HTTP (rotas) e do protocolo WebSocket (mensagens e handshakes).

---

## Resumo técnico

- **Arquitetura:** Clean + Hexagonal; domínio isolado; portas (interfaces) e adaptadores (Express, WS, Mongoose, Nodemailer, etc.).
- **Servidor híbrido:** HTTP e WebSocket no mesmo processo; WS no path `/ws`; roteador de mensagens por tipo (Chain of Responsibility).
- **Duas linguagens:** TypeScript (servidor) e Go (cliente de captura gerado e compilado pelo servidor).
- **Deploy:** Docker com Node + Go; preparado para AWS.
- **Qualidade:** Testes (Jest), validação com Zod, graceful shutdown (SIGTERM/SIGINT), CORS e cookies configurados.

Para detalhes das rotas, payloads e fluxos WebSocket, consulte [docs/API.md](docs/API.md). Para detalhes de camadas e módulos, consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
