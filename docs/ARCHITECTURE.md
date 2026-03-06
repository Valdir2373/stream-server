# Arquitetura do Stream Server

Este documento descreve a arquitetura do projeto: **Clean Architecture** combinada com **Hexagonal (Ports & Adapters)**. O domínio fica no centro; a infraestrutura depende dele por meio de interfaces (portas), e os adaptadores implementam essas interfaces.

---

## 1. Visão geral das camadas

```
                    ┌─────────────────────────────────────────┐
                    │              main.ts                     │
                    │         (AppModule.listen)                │
                    └────────────────────┬────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │           INFRASTRUCTURE                 │
                    │  App.ts │ Modules │ Controllers │         │
                    │  Adapters (Express, WS, Mongoose, etc.)  │
                    └────────────────────┬────────────────────┘
                                         │ depende de
                    ┌────────────────────▼────────────────────┐
                    │            APPLICATION                  │
                    │  Use Cases │ DTOs (Input/Output)         │
                    └────────────────────┬────────────────────┘
                                         │ depende de
                    ┌────────────────────▼────────────────────┐
                    │              DOMAIN                      │
                    │  Entities │ Repository Interfaces │      │
                    │  Domain Services (ICreateId, etc.)       │
                    └─────────────────────────────────────────┘
```

- **Domain:** não depende de nada externo. Contém entidades e **portas** (interfaces de repositório e serviços de domínio).
- **Application:** contém casos de uso e DTOs. Depende apenas do domain (interfaces).
- **Infrastructure:** implementa as portas (adapters), orquestra use cases e expõe HTTP/WS.

---

## 2. Domain (núcleo)

### 2.1 Entidades

- **UserEntities** (`domain/entities/User.ts`): usuário com id, username, email, password, verification, adm, created_at, updated_at. Métodos estáticos `generateEntitie`, `createFromData` e `updateFields`.
- **StreamEntities** (`domain/entities/Stream.ts`): stream com name, password, id, idUser. Métodos estáticos `generateStream`, `createFromData` e `updateFields`.

### 2.2 Portas (interfaces)

| Interface | Responsabilidade |
|-----------|-------------------|
| `IUserRepository` | getById, getByEmail, saveUser, deleteUserById, getAllUsers, UpdateUserById. |
| `IStreamRepository` | Contrato do repositório de streams. |
| `IAdminRepository` | Contrato do repositório de administradores. |
| `IDataAccess` | Abstração genérica: findMany, findOne, create, update, remove (collection + query). |
| `IDatabaseHandler` | getConnection, closePool (abstração da conexão com o banco). |
| `ICreateId` | generateID(). |
| `IPasswordHasher` | hash(plain), compare(plain, hashed). |

Todas ficam em `domain/repository/` ou `domain/services/`. Nenhuma importa Express, Mongoose ou `ws`.

---

## 3. Application (casos de uso)

### 3.1 Usuários

- **UserCreate** — cria usuário (hash de senha, geração de ID, persistência).
- **LoginUser** — valida credenciais e retorna dados para token.
- **GetUserById**, **GetUserByEmail**, **GetAllUsers** — leitura.
- **UpdateUser** — atualização (com hash de senha se necessário).
- **DeleteByIdUser** — exclusão por ID.
- **VerifyUserByEmail** — marca usuário como verificado.
- **AuthenticateUserByEmail** — autenticação por e-mail (uso no link de verificação).

Cada use case recebe no construtor apenas interfaces (repositório, hasher, createId).

### 3.2 Stream

- **CreateStream** (ou equivalente no StreamService) — persiste stream e dispara compilação.
- **CompileGoToExe** — gera código Go (cliente de captura), executa `go mod tidy` e `go build` (GOOS=windows, GOARCH=amd64), retorna path do .exe.
- **GetAllStreamsByIdUser**, **GetStreamByName**, **DeleteStreamById** — leitura e exclusão.

DTOs: `StreamInputDTO` (name, password), `StreamOutputDTO` (name, id).

### 3.3 Admin

- **CreateAdmin** — promove usuário a admin (uso em AdminService/AdminController).

---

## 4. Infrastructure (adapters e orquestração)

### 4.1 Servidor HTTP

- **Interface:** `IServer` — registerRouter(method, path, ...handlers), listen(port), getHttpServer().
- **Adapter:** `ExpressAdapter` — implementa `IServer`, usa Express, CORS, cookie-parser, mapeia req/res para `IRequest`/`IResponse`, middleware de erro global.

Assim, o domínio e os controllers não dependem do Express diretamente.

### 4.2 Servidor WebSocket

- **Interface:** `IWebSocketServer` — start(httpServer), onConnection(cb), onMessage(cb), close().
- **Adapter:** `WsWebSocketServerAdapter` — usa `ws`, path `/ws`, delega conexões e mensagens para callbacks.

Mensagens são roteadas por **WebSocketMessageRouter**, que mantém uma lista de **IWebSocketMessageHandler**. Cada handler tem `canHandle(messageString, isBinary, socket)` e `handle(socket, data, isBinary)`. Ordem: ClientVisualizer, CaptureClientConnectHandler, ImageRelayHandler, UnexpectedMessageHandler (por último).

### 4.3 Handlers WebSocket

| Handler | Tipo de mensagem | Função |
|---------|-------------------|--------|
| **ClientVisualizer** | `message === "CLIENT_CONNECT"` (JSON com id, idStream, password) | Valida usuário (UsersService), registra visualizador no ClientRegistry, envia "CLIENT_OK" ou "CLIENT_NEGED". |
| **CaptureClientConnectHandler** | `message === "CAPTURE_CLIENT_CONNECT"` (id, password) | Registra cliente de captura no ClientRegistry, envia `{ id, message: "CAPTURE_CLIENT_OK" }`. |
| **ImageRelayHandler** | JSON com `image` (Base64) e `id` (stream) | Confere se o socket é o cliente de captura registrado; valida senha do visualizador; envia a imagem ao socket do visualizador ou "PASSWORD INCORRET". |
| **UnexpectedMessageHandler** | Fallback | Trata mensagens não reconhecidas. |

### 4.4 ClientRegistry

Centraliza o estado das conexões WS:

- **Captura:** Map idStream → { socket, password } (cliente Go).
- **Visualizador:** Map idUser → { socket, stream, password } (navegador).

Métodos: registerClient (visualizador), registerCaptureClient, getClient (socket do visualizador por idStream), getCaptureClient, getClientVisualizer, verifyPasswordOfUserWithStream, unregisterClient, unregisterCaptureClient. Usa `IPasswordHasher` para comparar senha do visualizador com a senha da stream.

### 4.5 Persistência

- **IDatabaseHandler:** `MongooseHandler` (getConnection, closePool) ou `MySqlDatabaseHandler`.
- **IDataAccess:** `MongooseDataAccess` ou `MySqlDataAccess` — findMany, findOne, create, update, remove com nomes de coleção/tabela e queries.
- **Repositories:** `UserRepository`, `StreamRepository`, `AdminRepository` implementam as interfaces do domain usando `IDataAccess`.

### 4.6 Segurança e e-mail

- **IAuthTokenManager:** `JsonwebtokenAuthTokenManager` — generateToken, generateRefreshToken, verifyToken, verifyRefreshToken, verifyTokenTimerSet (link de e-mail).
- **IPasswordHasher:** `BcryptPasswordHasher`.
- **IEmailService:** `NodemailerEmailService` — sendEmailVerificationUser.

### 4.7 Módulos (composição)

- **AppModule (App.ts):** instancia ConfigDB, MongooseHandler, MongooseDataAccess, authTokenManager, email, createId, passwordHasher, ExpressAdapter, ClientRegistry, handlers WS, WebSocketMessageRouter, WsWebSocketServerAdapter. Expõe `listen(port)`: registra módulos, sobe HTTP, inicia WS, registra onMessage no router, trata SIGTERM/SIGINT com graceful shutdown.
- **UsersModule:** recebe server, dataAccess, authTokenManager, email, createId, passwordHasher, getUsersService, getUsersSchemas. Monta UserController e AuthController (rotas de usuário e login/refresh/verify) e instancia StreamModule.
- **StreamModule:** monta StreamController (rotas de stream e createStream que chama CompileGoToExe e devolve .exe).
- **AdminModule:** monta AdminController (post /createAdmin).
- **ViewModule:** monta ViewController (páginas estáticas: /, login, register, myProfile, myStreams, watchStream, streamCreate).

---

## 5. Fluxo de dependência

- **Domain** não importa application nem infra.
- **Application** importa apenas domain (entidades e interfaces).
- **Infrastructure** importa domain e application (use cases, DTOs). Nenhum use case importa infra; a injeção é feita nos services/controllers (construtores).

A inversão é clara: por exemplo, `UserCreate` recebe `IUserRepository`; quem instancia é o `UsersService` na infra, passando `UserRepository`.

---

## 6. Decisões importantes

- **Servidor híbrido:** mesmo processo Node para HTTP e WS; WS acoplado ao mesmo HttpServer do Express via `path: '/ws'`.
- **Geração de cliente em Go:** use case na application orquestra spawn de `go mod tidy` e `go build`; o código Go é gerado em string no TypeScript (template com id da stream, id do usuário, senha). O executável é temporário e servido em resposta HTTP; depois removido.
- **Validação:** schemas (ex.: UsersSchemas) usam builder Zod (ZodDTOBuilderAndValidator) para DTOs; erros lançam ValidationError com detalhes.
- **Graceful shutdown:** SIGTERM/SIGINT fecha WS, depois HTTP, depois pool do banco; timeout de 10s força exit(1).

Para a lista completa de rotas HTTP e formato das mensagens WebSocket, veja [API.md](API.md).
