import { IWebSocket } from "../../infra/server/interfaces/ws/IWebSocket";
import { IWebSocketMessageHandler } from "./interfaces/IWebSocketMessageHandler";
import { WebSocket } from "ws";
import { ClientRegistry } from "../client/ClientRegistry";

interface ImagePayload {
  id: string;
  image: string;
  idUser: string;
  password: string;
}

let idClient = "";

export class ImageRelayHandler implements IWebSocketMessageHandler {
  private clientRegistry: ClientRegistry;

  constructor(clientRegistry: ClientRegistry) {
    this.clientRegistry = clientRegistry;
  }

  canHandle(
    messageString: string,
    isBinary: boolean,
    senderSocket: IWebSocket
  ): boolean {
    if (isBinary) {
      return false;
    }

    try {
      const parsedMessage: ImagePayload = JSON.parse(messageString);

      if (typeof parsedMessage.image === "string") {
        const captureClient = this.clientRegistry.getCaptureClient(
          parsedMessage.id
        );

        idClient = parsedMessage.id;

        const isFromCaptureClient =
          captureClient && senderSocket === captureClient;

        if (!isFromCaptureClient) {
          // console.log(
          //   `[ImageRelayHandler] Mensagem JSON de imagem recebida de um cliente não registrado como captura ou ID inválido. ID da mensagem: ${parsedMessage.id}`
          // );
          return false;
        }

        return true;
      }
    } catch (error: any) {
      console.log("error em [ImageRelayHandler]:" + error.message);
      return false;
    }

    return false;
  }

  async handle(
    socket: IWebSocket,
    data: Buffer,
    isBinary: boolean
  ): Promise<void> {
    let parsedMessage: ImagePayload | null = null;
    try {
      const jsonStringData = data.toString("utf8");
      parsedMessage = JSON.parse(jsonStringData);
    } catch (error) {
      console.error(
        "[ImageRelayHandler] Erro ao parsear a mensagem JSON recebida:",
        error
      );
      return;
    }

    if (!parsedMessage) throw new Error("erro: parsedMessage: null");

    const adminSocket = this.clientRegistry.getClient(parsedMessage.id);

    if (!adminSocket || adminSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const clientVisualizer = this.clientRegistry.getClientVisualizer(
        parsedMessage.id
      );

      let result: boolean = false;
      if (idClient && clientVisualizer) {
        result = await this.clientRegistry.verifyPasswordOfUserWithStream(
          clientVisualizer.password,
          idClient
        );
      }

      console.log("resultado: " + result);
      console.log("idClient: " + idClient);
      console.log("clientVisualizer: " + clientVisualizer);

      if (result) return adminSocket.send(parsedMessage.image);
      throw new Error("ERRO NA SENHA TALVEZ INCORRETA");
    } catch (error) {
      // console.error(
      //   "[ImageRelayHandler] Erro ao retransmitir imagem para o Client:",
      //   error
      // );
    }
  }
}
