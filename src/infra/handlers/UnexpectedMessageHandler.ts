import { IWebSocket } from "../../infra/server/interfaces/ws/IWebSocket";
import { IWebSocketMessageHandler } from "./interfaces/IWebSocketMessageHandler";

export class UnexpectedMessageHandler implements IWebSocketMessageHandler {
  canHandle(
    messageString: string,
    isBinary: boolean,
    senderSocket: IWebSocket
  ): boolean {
    return true;
  }

  handle(socket: IWebSocket, data: Buffer, isBinary: boolean): void {
    const preview =
      data.length > 50
        ? data.toString("utf8", 0, 50) + "..."
        : data.toString("utf8");
    console.warn(
      `[UnexpectedMessageHandler] Mensagem inesperada ou sem destinatário: ${preview}`
    );
    socket.send(
      `Desculpe, não entendi sua mensagem ou o formato: "${preview}"`
    );
  }
}
