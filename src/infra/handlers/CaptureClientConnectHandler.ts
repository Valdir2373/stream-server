import { IWebSocket } from "../../infra/server/interfaces/ws/IWebSocket";
import { IWebSocketMessageHandler } from "./interfaces/IWebSocketMessageHandler";
import { IClientRegistry } from "../client/interfaces/IClientRegistry";

export interface CaptureConnectMessageInputDto {
  id: string;
  message: string;
}

export class CaptureClientConnectHandler implements IWebSocketMessageHandler {
  private clientRegistry: IClientRegistry;

  constructor(clientRegistry: IClientRegistry) {
    this.clientRegistry = clientRegistry;
  }

  canHandle(
    messageString: string,
    isBinary: boolean,
    senderSocket: IWebSocket
  ): boolean {
    if (isBinary) return false;

    try {
      const message = JSON.parse(
        messageString
      ) as CaptureConnectMessageInputDto;

      return message.message === "CAPTURE_CLIENT_CONNECT";
    } catch (error) {
      return false;
    }
  }

  handle(socket: IWebSocket, data: Buffer, isBinary: boolean): void {
    const message = JSON.parse(
      data.toString()
    ) as CaptureConnectMessageInputDto;

    console.log(
      `[CaptureClientConnectHandler] Processando conexão de cliente de captura. Stream ID: ${message.id}`
    );

    this.clientRegistry.registerCaptureClient(socket, message.id);
    socket.send(
      JSON.stringify({
        id: message.id,
        message: "CAPTURE_CLIENT_OK",
      })
    );
  }
}
