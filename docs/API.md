# Referência da API — Stream Server

Documentação das rotas **HTTP** e do protocolo **WebSocket** do Stream Server.

---

## 1. Base URL e WebSocket

- **HTTP:** `http://localhost:1090` (ou a URL do deploy, ex.: `https://stream-server-vava.onrender.com`).
- **WebSocket:** `ws://localhost:1090/ws` (ou `wss://...` em produção). Todas as conexões WS usam o path **`/ws`**.

---

## 2. Autenticação HTTP

A autenticação usa **cookies httpOnly**:

- **tokenAcess** — token de acesso JWT (ex.: 16 minutos).
- **refreshToken** — token de refresh (ex.: 12 dias).

Rotas protegidas dependem do cookie `tokenAcess` válido (verificação feita nos controllers com `AuthController.verifyCookieToAcess(req)`). O refresh é feito via `GET /refreshToken` (usa `refreshToken` no cookie).

---

## 3. Rotas HTTP

### 3.1 Páginas (ViewController)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Página inicial (index.html). |
| GET | `/login.html` | Página de login (se não logado). |
| GET | `/register.html` | Página de registro (se não logado). |
| GET | `/myProfile.html` | Perfil do usuário (requer login). |
| GET | `/myStreams.html` | Lista de streams do usuário (requer login). |
| GET | `/watchStream` | Página para assistir stream. |
| GET | `/streamCreate.html` | Página para criar stream. |

Arquivos estáticos (JS/CSS) são servidos em `/js`, `/css` e conforme configurado no ExpressAdapter.

---

### 3.2 Usuários (UserController)

| Método | Rota | Descrição | Body / Params |
|--------|------|-----------|----------------|
| POST | `/register` | Registrar novo usuário. | Body: `{ username, useremail, userpassword }` |
| GET | `/users` | Listar todos os usuários. | — |
| GET | `/users/id/:id` | Obter usuário por ID. | Params: `id` |
| GET | `/users/email/:email` | Obter usuário por e-mail. | Params: `email` |
| DELETE | `/users/delete/:id` | Excluir usuário por ID. | Params: `id` |

**Exemplo — Registro (POST /register):**

```json
{
  "username": "meuuser",
  "useremail": "user@example.com",
  "userpassword": "senha123"
}
```

Resposta de sucesso (201): `{ "id", "username", "email" }`. Em erro de validação ou e-mail já existente, retorna 401 com mensagem.

---

### 3.3 Autenticação (AuthController)

| Método | Rota | Descrição | Body / Params |
|--------|------|-----------|----------------|
| POST | `/users/login` | Login. Define cookies `tokenAcess` e `refreshToken`. | Body: `{ useremail, userpassword }` |
| GET | `/verifyUser` | Verificar se o usuário está autenticado (lê cookie). | — |
| GET | `/refreshToken` | Renovar token de acesso usando refreshToken. | Cookies |
| GET | `/verifyEmail/:token` | Verificação de e-mail (link do e-mail). Redireciona após sucesso. | Params: `token` |
| GET | `/resend-verification/:email` | Reenviar e-mail de verificação. | Params: `email` |

**Exemplo — Login (POST /users/login):**

```json
{
  "useremail": "user@example.com",
  "userpassword": "senha123"
}
```

Sucesso: 200 + body com dados do usuário + cookies setados. Falha: 401 (ex.: "User not found").

---

### 3.4 Streams (StreamController)

Todas as rotas de stream que precisam de usuário logado verificam o cookie de acesso.

| Método | Rota | Descrição | Body / Params |
|--------|------|-----------|----------------|
| POST | `/createStream` | Criar stream, compilar cliente Go e retornar .exe no body. | Body: `{ name, password }` |
| GET | `/getAllStreams/` | Listar streams do usuário logado. | Cookies (token) |
| POST | `/getStreamIdByName/:nameStream` | Obter ID da stream pelo nome. | Params: `nameStream`; Body: `{ idUser }` |
| DELETE | `/deleteStream/:idStream` | Excluir stream por ID. | Params: `idStream` |

**POST /createStream:**  
- Body: `{ "name": "Minha Stream", "password": "senhaDaStream" }`.  
- Resposta de sucesso: HTTP 200 com `Content-Type: application/octet-stream` e `Content-Disposition: attachment; filename="capture_client.exe"` — corpo é o binário do executável.  
- Em falha de compilação ou erro interno: 403/500 com JSON de erro.

**GET /getAllStreams/:**  
- Resposta: array de `StreamOutputDTO`: `[{ "name", "id" }, ...]`.

---

### 3.5 Administrador (AdminController)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| POST | `/createAdmin` | Promover usuário a admin pelo e-mail. | Body: `{ email }` |

Resposta: 200 com mensagem (ex.: confirmação ou erro).

---

## 4. Protocolo WebSocket (path `/ws`)

Uma única URL WS (`/ws`) atende dois tipos de cliente:

1. **Cliente de captura** (aplicação Go/.exe): envia handshake `CAPTURE_CLIENT_CONNECT`, depois envia frames de imagem em JSON (Base64).
2. **Cliente visualizador** (navegador): envia handshake `CLIENT_CONNECT` para assistir a uma stream; recebe imagens (Base64) ou mensagem de senha incorreta.

O servidor usa **WebSocketMessageRouter** e handlers para decidir quem processa cada mensagem (por tipo de mensagem e, no caso de imagens, por socket registrado como captura).

---

### 4.1 Handshake — Cliente de captura (Go)

O cliente de captura envia primeiro um JSON de texto:

```json
{
  "id": "<id da stream>",
  "idUser": "<id do usuário>",
  "password": "<senha da stream>",
  "message": "CAPTURE_CLIENT_CONNECT"
}
```

**Resposta do servidor (sucesso):**

```json
{
  "id": "<id da stream>",
  "message": "CAPTURE_CLIENT_OK"
}
```

Após isso, o cliente envia mensagens de imagem (ver abaixo).

---

### 4.2 Handshake — Cliente visualizador (navegador)

O visualizador envia um JSON de texto:

```json
{
  "id": "<id do usuário>",
  "idStream": "<id da stream>",
  "password": "<senha da stream para assistir>",
  "message": "CLIENT_CONNECT"
}
```

**Resposta do servidor:**  
- Sucesso: texto `"CLIENT_OK"`.  
- Falha (usuário inexistente): texto `"CLIENT_NEGED"`.

---

### 4.3 Mensagens de imagem (captura → servidor → visualizador)

O cliente de captura (Go) envia mensagens de texto JSON:

```json
{
  "id": "<id da stream>",
  "image": "<string Base64 da imagem JPEG>",
  "idUser": "<id do usuário dono da stream>"
}
```

O servidor:

- Verifica se o socket é o cliente de captura registrado para essa stream.
- Obtém o socket do visualizador associado à stream e verifica a senha informada no `CLIENT_CONNECT` com a senha da stream (hash).
- Se a senha estiver correta: envia ao visualizador **apenas a string Base64** da imagem (não o JSON inteiro).
- Se a senha estiver incorreta: envia ao visualizador a string `"PASSWORD INCORRET"` e pode desregistrar o visualizador.

O visualizador deve tratar no `onmessage`:  
- Se for string Base64 (ex.: começa com `iVBORw0KGgo` ou outro prefixo de imagem): exibir frame.  
- Se for `"PASSWORD INCORRET"`: mostrar erro e/ou reconectar.

---

## 5. CORS e cookies

- Em produção, CORS está configurado para origens permitidas (ex.: `https://stream-server-vava.onrender.com`); em desenvolvimento, `http://localhost:1090` é aceito.
- Cookies usam `sameSite: "lax"`, `httpOnly: true` e `secure` em produção. Rotas que precisam de autenticação leem o cookie `tokenAcess` (via middleware ou controller).

---

## 6. Resumo rápido

| Área | Rotas principais |
|------|-------------------|
| **Auth** | POST `/users/login`, GET `/refreshToken`, GET `/verifyEmail/:token` |
| **Users** | POST `/register`, GET `/users`, GET `/users/id/:id`, GET `/users/email/:email`, DELETE `/users/delete/:id` |
| **Streams** | POST `/createStream`, GET `/getAllStreams/`, POST `/getStreamIdByName/:nameStream`, DELETE `/deleteStream/:idStream` |
| **Admin** | POST `/createAdmin` |
| **WS** | Conexão em `ws(s)://host/ws`; handshakes `CAPTURE_CLIENT_CONNECT` e `CLIENT_CONNECT`; imagens em JSON com `id`, `image`, `idUser`. |

Para visão da arquitetura e dos módulos, veja [ARCHITECTURE.md](ARCHITECTURE.md).
