import { spawn } from "child_process";
import { writeFile, unlink, mkdir, cp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { ICreateId } from "../../../domain/services/ICreateId"; // Assegure que este caminho está correto

export class CompileGoToExe {
  async execute(
    idUser: string,
    idStream: string
  ): Promise<{ path: string; status: boolean }> {
    const tempDir = join(tmpdir(), `go_compile_${Date.now()}`);
    const goFileName = join(tempDir, "temp_capture_client.go");
    const outputExeName = join(tempDir, "capture_client.exe");
    const goModTemplate = join(process.cwd(), "go-mod-template");

    const goCode = this.codeGo(idStream, idUser);

    try {
      await mkdir(tempDir, { recursive: true });
      console.log(
        `[CompileGoToExe]: Diretório temporário criado em ${tempDir}`
      );

      // Copia o go.mod e go.sum (se existir) do template para o diretório temporário
      await cp(join(goModTemplate, "go.mod"), join(tempDir, "go.mod"));
      console.log(
        `[CompileGoToExe]: go.mod copiado para ${join(tempDir, "go.mod")}`
      );
      try {
        await cp(join(goModTemplate, "go.sum"), join(tempDir, "go.sum"));
        console.log(
          `[CompileGoToExe]: go.sum copiado para ${join(tempDir, "go.sum")}`
        );
      } catch (sumErr: any) {
        // go.sum pode não existir inicialmente, é normal.
        console.warn(
          `[CompileGoToExe]: go.sum não encontrado em ${goModTemplate}. Será gerado por 'go mod tidy' se necessário.`
        );
      }

      await writeFile(goFileName, goCode);
      console.log(`[CompileGoToExe]: Código Go salvo em ${goFileName}`);

      // --- Executar 'go mod tidy' para resolver dependências ---
      console.log(`[CompileGoToExe]: Executando 'go mod tidy' em ${tempDir}`);
      const tidyProcess = spawn("go", ["mod", "tidy"], {
        cwd: tempDir,
        env: {
          ...process.env,
          GOOS: "windows", // Compilar para Windows
          GOARCH: "amd64", // Arquitetura AMD64
        },
      });

      let tidyStdout = "";
      let tidyStderr = "";
      tidyProcess.stdout.on("data", (data) => (tidyStdout += data.toString()));
      tidyProcess.stderr.on("data", (data) => (tidyStderr += data.toString()));

      await new Promise<void>((resolve, reject) => {
        tidyProcess.on("close", (code) => {
          if (code === 0) {
            console.log(
              "[CompileGoToExe]: 'go mod tidy' concluído com sucesso."
            );
            resolve();
          } else {
            console.error(
              `[CompileGoToExe]: Erro em 'go mod tidy' (código ${code}):`
            );
            console.error("Saída de go mod tidy (stderr):\n", tidyStderr);
            reject(new Error(`Falha em 'go mod tidy':\n${tidyStderr}`));
          }
        });
        tidyProcess.on("error", (err) => {
          console.error(
            "[CompileGoToExe]: Erro ao iniciar 'go mod tidy':",
            err
          );
          reject(new Error(`Erro ao iniciar 'go mod tidy': ${err.message}`));
        });
      });

      // --- Iniciar compilação ---
      console.log(
        `[CompileGoToExe]: Iniciando compilação Go para ${outputExeName}`
      );
      const compileProcess = spawn(
        "go",
        ["build", "-o", outputExeName, goFileName],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            GOOS: "windows",
            GOARCH: "amd64",
          },
        }
      );

      let stdout = "";
      let stderr = "";

      compileProcess.stdout.on("data", (data) => (stdout += data.toString()));
      compileProcess.stderr.on("data", (data) => (stderr += data.toString()));

      return new Promise((resolve) => {
        compileProcess.on("close", async (code) => {
          if (code === 0) {
            console.log(`[CompileGoToExe]: Compilação bem-sucedida!`);
            // Limpa arquivos internos (código fonte, go.mod, go.sum), mas mantém o executável
            try {
              await unlink(goFileName);
              await unlink(join(tempDir, "go.mod"));
              await unlink(join(tempDir, "go.sum")); // Remover também go.sum
              console.log(
                `[CompileGoToExe]: Arquivos temporários internos limpos em ${tempDir}.`
              );
            } catch (cleanupErr: any) {
              console.warn(
                `[CompileGoToExe]: Aviso na limpeza interna de arquivos temporários:`,
                cleanupErr
              );
            }
            resolve({ path: outputExeName, status: true });
          } else {
            console.error(
              `[CompileGoToExe]: Erro na compilação Go (código ${code}):`
            );
            console.error("Saída do compilador (stderr):\n", stderr);
            // Em caso de falha, remove todo o diretório temporário
            try {
              await rm(tempDir, { recursive: true, force: true });
              console.log(
                `[CompileGoToExe]: Diretório temporário ${tempDir} removido devido a erro de compilação.`
              );
            } catch (cleanupErr: any) {
              console.error(
                `[CompileGoToExe]: Erro ao remover diretório ${tempDir} após falha:`,
                cleanupErr
              );
            }
            resolve({ path: "", status: false });
          }
        });

        compileProcess.on("error", async (err) => {
          console.error(
            "[CompileGoToExe]: Erro ao iniciar compilação Go:",
            err
          );
          // Em caso de erro ao iniciar o processo, remove todo o diretório temporário
          try {
            await rm(tempDir, { recursive: true, force: true });
            console.log(
              `[CompileGoToExe]: Diretório temporário ${tempDir} removido devido a erro ao iniciar processo.`
            );
          } catch (cleanupErr: any) {
            console.error(
              `[CompileGoToExe]: Erro ao remover diretório ${tempDir} após erro de spawn:`,
              cleanupErr
            );
          }
          resolve({ path: "", status: false });
        });
      });
    } catch (err: any) {
      console.error(
        "[CompileGoToExe]: Erro geral na etapa inicial ou 'go mod tidy':",
        err
      );
      // Garante que o diretório temporário seja removido se as etapas iniciais falharem
      try {
        await rm(tempDir, { recursive: true, force: true });
        console.log(
          `[CompileGoToExe]: Diretório temporário ${tempDir} removido devido a erro geral.`
        );
      } catch (cleanupErr: any) {
        console.error(
          `[CompileGoToExe]: Erro ao remover diretório ${tempDir} após erro geral:`,
          cleanupErr
        );
      }
      return { path: "", status: false };
    }
  }

  /**
   * Gera o código fonte Go para o cliente de captura.
   * Inclui lógica para capturar tela, codificar em Base64 e enviar via WebSocket
   * com o ID da stream (gerado no TS) como 'id' da captura, e o ID do usuário.
   * @param idStream O ID da stream/instância do cliente (gerado no TS, para o 'id' da captura).
   * @param idUser O ID do usuário a ser incluído como 'idUser' no payload.
   * @returns A string contendo o código fonte Go.
   */
  codeGo(idStream: string, idUser: string): string {
    const escapedIdStream = idStream;
    const escapedIdUser = idUser; // Escapar o idUser para inclusão segura no código Go

    return (
      "package main\n\n" +
      "import (\n" +
      ' "bytes"\n' +
      ' "encoding/base64"\n' + // Importação para codificação Base64
      ' "encoding/json"\n' +
      ' "image/jpeg"\n' +
      ' "log"\n' +
      ' "os"\n' +
      ' "os/signal"\n' +
      ' "syscall"\n' +
      ' "time"\n' +
      ' "sync"\n\n' + // Adicionado para WaitGroup
      ' "github.com/gorilla/websocket"\n' +
      ' "github.com/kbinani/screenshot"\n' +
      ")\n\n" +
      "// Message define a estrutura da mensagem inicial enviada ao servidor WebSocket (handshake).\n" +
      "type Message struct {\n" +
      ' ID      string `json:"id"` \n' + // Corrigido para "id" (camelCase)
      ' IDUser  string `json:"idUser"` \n' + // Corrigido para "idUser" (camelCase)
      ' Message string  `json:"message"`\n' + // Corrigido para "message" (camelCase)
      "}\n\n" +
      "// ImagePayload define a estrutura do JSON para cada imagem enviada.\n" +
      "type ImagePayload struct {\n" +
      ' ID    string `json:"id"` // O ID da captura agora é o ID da stream/instância\n' + // Corrigido para "id" (camelCase)
      ' Image string  `json:"image"` // Imagem codificada em Base64\n' + // Corrigido para "image" (camelCase)
      ' IDUser  string `json:"idUser"` // ID do usuário associado à captura\n' + // Corrigido para "idUser" (camelCase)
      "}\n\n" +
      'const WS_URL = "ws://stream-server-vava.onrender.com:1090/ws" \n\n' + // URL do servidor WebSocket (ajuste conforme necessário)
      "func main() {\n" +
      ' log.Println("Go Client: Iniciando aplicação de captura e cliente WebSocket...")\n\n' +
      " conn, _, err := websocket.DefaultDialer.Dial(WS_URL, nil)\n" +
      " if err != nil {\n" +
      '  log.Fatalf("Go Client: Falha ao conectar ao servidor WebSocket: %v", err)\n' +
      " }\n" +
      " defer conn.Close()\n" +
      ' log.Println("Go Client: Conectado ao servidor WebSocket.")\n\n' +
      // ID da stream/cliente injetado do TypeScript para o handshake inicial
      // Este será o 'id' para cada captura, identificando a fonte da stream.
      ` var clientStreamID string = "` +
      escapedIdStream +
      `"` +
      "\n" +
      // Não é mais um ponteiro opcional, pois o ID será sempre fornecido
      " var idStreamVal string = clientStreamID\n" +
      ' if idStreamVal != "" {\n' +
      '  log.Printf("Go Client: ID de Stream fornecido: %s", idStreamVal)\n' +
      " } else {\n" +
      '  log.Println("Go Client: Nenhum ID de Stream fornecido para o handshake. Usando ID vazio.")\n' +
      " }\n\n" +
      // ID do usuário injetado do TypeScript para as capturas de tela e handshake
      ` var userID string = "` +
      escapedIdUser +
      `"` +
      "\n" +
      ' log.Printf("Go Client: ID de Usuário para capturas: %s", userID)\n\n' +
      " initialMsg := Message{\n" +
      "  ID:      idStreamVal, \n" + // Usando o ID da stream para o ID da mensagem inicial
      "  IDUser:  userID,\n" + // Incluindo userID na mensagem inicial
      '  Message: "CAPTURE_CLIENT_CONNECT",\n' +
      " }\n\n" +
      " jsonMessage, err := json.Marshal(initialMsg) \n" +
      " if err != nil {\n" +
      '  log.Printf("Go Client: Erro ao serializar JSON inicial: %v", err)\n' +
      "  return\n" +
      " }\n\n" +
      " var wg sync.WaitGroup\n" +
      " wg.Add(1) // Adiciona um contador para a goroutine de leitura da resposta OK\n\n" +
      " err = conn.WriteMessage(websocket.TextMessage, jsonMessage) \n" +
      " if err != nil {\n" +
      '  log.Printf("Go Client: Erro ao enviar JSON inicial: %v", err)\n' +
      "  return\n" +
      " }\n" +
      ' log.Printf("Go Client: JSON inicial enviado: %s", jsonMessage)\n\n' +
      " interrupt := make(chan os.Signal, 1)\n" +
      " signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)\n\n" +
      " done := make(chan struct{})\n" +
      " connectedOK := make(chan struct{}, 1) // Canal para sinalizar conexão OK\n\n" +
      " go func() {\n" +
      "  defer close(done)\n" +
      "  for {\n" +
      "   _, message, err := conn.ReadMessage()\n" +
      "   if err != nil {\n" +
      "    if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {\n" +
      '     log.Printf("Go Client: Erro de leitura WebSocket: %v", err)\n' +
      "    } else {\n" +
      '     log.Println("Go Client: Conexão WebSocket fechada.")\n' +
      "    }\n" +
      "    return\n" +
      "   }\n" +
      '   log.Printf("Go Client: Mensagem do servidor: %s", message)\n' +
      "   var serverResponse map[string]interface{}\n" +
      "   if err := json.Unmarshal(message, &serverResponse); err == nil {\n" +
      `    if msg, ok := serverResponse["message"].(string); ok && msg == "CAPTURE_CLIENT_OK" {\n` +
      "      select {\n" +
      "      case connectedOK <- struct{}{}:\n" +
      '        log.Println("Go Client: Recebido CAPTURE_CLIENT_OK. Iniciando ciclo de captura.")\n' +
      "        wg.Done() // Sinaliza que a resposta OK foi recebida\n" +
      "      default:\n" +
      "        // Já sinalizou, ignora\n" +
      "      }\n" +
      "    }\n" +
      "   }\n" +
      "  }\n" +
      " }()\n\n" +
      " wg.Wait() // Espera até que CAPTURE_CLIENT_OK seja recebido\n\n" +
      " ticker := time.NewTicker(time.Millisecond * 16) \n" + // Ajuste o intervalo de captura aqui (ex: 16ms = ~60 FPS)
      " defer ticker.Stop()\n\n" +
      ' log.Println("Go Client: Iniciando captura de tela e envio...")\n\n' +
      " for {\n" +
      "  select {\n" +
      "  case <-done:\n" +
      '   log.Println("Go Client: Goroutine de leitura encerrada, finalizando captura.")\n' +
      "   return\n" +
      "  case <-interrupt:\n" +
      '   log.Println("Go Client: Sinal de interrupção recebido. Fechando conexão WebSocket...")\n' +
      '   err := conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))\n' +
      "   if err != nil {\n" +
      '    log.Printf("Go Client: Erro ao enviar CloseMessage: %v", err)\n' +
      "    return\n" +
      "   }\n" +
      "   select {\n" +
      "   case <-done:\n" +
      "   case <-time.After(time.Second):\n" +
      "   }\n" +
      '   log.Println("Go Client: Aplicação encerrada.")\n' +
      "   return\n" +
      "  case <-ticker.C:\n" +
      "   n := screenshot.NumActiveDisplays()\n" +
      "   if n == 0 {\n" +
      "    continue\n" +
      "   }\n\n" +
      "   bounds := screenshot.GetDisplayBounds(0)\n" +
      "   img, err := screenshot.CaptureRect(bounds)\n" +
      "   if err != nil {\n" +
      '    log.Println("Go Client: Erro ao capturar tela:", err)\n' +
      "    continue\n" +
      "   }\n\n" +
      "   var buf bytes.Buffer\n" +
      "   err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 70})\n" + // Qualidade JPEG (0-100)
      "   if err != nil {\n" +
      '    log.Println("Go Client: Erro ao codificar JPEG:", err)\n' +
      "    continue\n" +
      "   }\n\n" +
      "   // Codifica a imagem em Base64.\n" +
      "   encodedImage := base64.StdEncoding.EncodeToString(buf.Bytes())\n\n" +
      "   // Cria o payload JSON com o ID da stream/instância (como 'id' da captura) e o ID do usuário.\n" +
      "   imagePayload := ImagePayload{\n" +
      "    ID:    idStreamVal,\n" + // Usando idStreamVal como o 'id' da imagem, conforme sua indicação
      "    Image: encodedImage,\n" + // Imagem codificada em Base64
      "    IDUser: userID,\n" + // ID do usuário associado à captura
      "   }\n\n" +
      "   // Serializa o payload da imagem para JSON.\n" +
      "   jsonImage, err := json.Marshal(imagePayload)\n" +
      "   if err != nil {\n" +
      '    log.Printf("Go Client: Erro ao serializar JSON da imagem: %v", err)\n' +
      "    continue\n" +
      "   }\n\n" +
      "   // Envia o JSON da imagem via WebSocket como mensagem de texto.\n" +
      "   err = conn.WriteMessage(websocket.TextMessage, jsonImage)\n" +
      "   if err != nil {\n" +
      '    log.Printf("Go Client: Erro ao enviar JSON da imagem via WebSocket: %v", err)\n' +
      "    return\n" +
      "   }\n" +
      "  }\n" +
      " }\n" +
      "}"
    ).replace(/\u00A0/g, " "); // Substitui U+00A0 por espaço normal
  }
}
