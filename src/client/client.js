// client.js
import { WebSocket } from "ws";
import { spawn } from "child_process";
import { Buffer } from "buffer"; // Buffer global em Node.js, mas import explícito para clareza em ESModule

// O DELIMITER DEVE SER EXATAMENTE O MESMO DO capture.go
const FRAME_DELIMITER = Buffer.from([
  0xff, 0xda, 0xbe, 0xef, 0xca, 0xfe, 0x00, 0x01,
]);

const ws = new WebSocket("ws://localhost:1090/ws");
let captureProcess = null;
let bufferRemainder = Buffer.alloc(0); // Buffer para armazenar dados parciais entre chunks

ws.onopen = () => {
  console.log(
    "Client: Conectado ao servidor WebSocket como cliente de captura."
  );
  ws.send("CAPTURE_CLIENT_CONNECT"); // Informa ao servidor que é o cliente de captura JS

  startCaptureProcess();
};

ws.onmessage = (event) => {
  if (event.data === "CAPTURE_CLIENT_OK") {
    console.log("Client: Servidor confirmou conexão do cliente de captura.");
  }
};

ws.onclose = () => {
  console.log(
    "Client: Conexão WebSocket fechada. Encerrando processo de captura Go..."
  );
  stopCaptureProcess();
};

ws.onerror = (error) => {
  console.error("Client: Erro na conexão WebSocket:", error);
  stopCaptureProcess();
};

function startCaptureProcess() {
  if (captureProcess) {
    console.log("Client: Processo de captura Go já está rodando.");
    return;
  }

  // ATENÇÃO: No Windows, use 'capture.exe' ou '.\capture.exe'
  // Para Linux/macOS, use './capture'
  // Se o executável não estiver na mesma pasta do client.js, forneça o caminho completo.
  captureProcess = spawn("./capture"); // Exemplo: spawn('./path/to/your/capture')

  console.log("Client: Processo Go de captura iniciado.");

  captureProcess.stdout.on("data", (data) => {
    bufferRemainder = Buffer.concat([bufferRemainder, data]);

    let delimiterIndex;
    // Continuamos processando o buffer enquanto houver um delimitador
    while ((delimiterIndex = bufferRemainder.indexOf(FRAME_DELIMITER)) !== -1) {
      const frame = bufferRemainder.slice(0, delimiterIndex);

      // Verificamos se o frame tem conteúdo real antes de enviar.
      // Um frame.length de 0 pode acontecer se o delimitador for o primeiro do buffer.
      if (frame.length > 0) {
        // O console.log foi removido daqui para evitar spam após confirmação do funcionamento.
        // console.log(`Client: Enviando frame de tamanho: ${frame.length} bytes`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(frame);
        } else {
          console.warn(
            "Client: WebSocket não está OPEN, não foi possível enviar frame."
          );
        }
      }
      // Move o buffer restante para o ponto após o delimitador
      bufferRemainder = bufferRemainder.slice(
        delimiterIndex + FRAME_DELIMITER.length
      );
    }
  });

  captureProcess.stderr.on("data", (data) => {
    // Redireciona erros do Go para o console do Node.js
    console.error(`Client: capture.go ERR: ${data.toString().trim()}`);
  });

  captureProcess.on("close", (code) => {
    console.log(`Client: Processo Go de captura encerrado com código ${code}`);
    captureProcess = null; // Reseta a referência
    // Opcional: tentar reiniciar o processo Go se for um encerramento inesperado
    // if (code !== 0) { setTimeout(startCaptureProcess, 5000); }
  });

  captureProcess.on("error", (err) => {
    console.error("Client: Falha ao iniciar processo Go:", err);
    captureProcess = null; // Reseta a referência
  });
}

function stopCaptureProcess() {
  if (captureProcess && !captureProcess.killed) {
    console.log("Client: Enviando sinal para encerrar processo Go...");
    captureProcess.kill("SIGTERM"); // Sinal para encerramento "gentil"
    captureProcess = null;
  }
}

// Lida com o encerramento do processo Node.js (Ctrl+C)
process.on("SIGINT", () => {
  console.log(
    "Client: SIGINT recebido. Node.js encerrando. Matando processo Go..."
  );
  stopCaptureProcess();
  process.exit(0); // Garante que o processo Node.js saia
});

// Lida com outros encerramentos inesperados
process.on("exit", (code) => {
  if (captureProcess && !captureProcess.killed) {
    console.log(
      "Client: Processo Node.js encerrando. Garantindo que o Go seja morto."
    );
    stopCaptureProcess();
  }
  console.log(`Client: Node.js encerrado com código ${code}`);
});
