import { IWebSocket } from "../../infra/server/interfaces/ws/IWebSocket";
import { IWebSocketMessageHandler } from "./interfaces/IWebSocketMessageHandler";
import { IClientRegistry } from "../client/interfaces/IClientRegistry";
import { WebSocket } from "ws";

interface ImagePayload {
  id: string;
  image: string;
  idUser: string;
}

export class ImageRelayHandler implements IWebSocketMessageHandler {
  private clientRegistry: IClientRegistry;

  constructor(clientRegistry: IClientRegistry) {
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
    } catch (error) {
      return false;
    }

    return false;
  }

  handle(socket: IWebSocket, data: Buffer, isBinary: boolean): void {
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
      adminSocket.send(parsedMessage.image);
    } catch (error) {
      console.error(
        "[ImageRelayHandler] Erro ao retransmitir imagem para o Client:",
        error
      );
    }
  }
}
