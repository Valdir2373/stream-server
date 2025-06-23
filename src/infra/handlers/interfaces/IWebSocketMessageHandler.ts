import { IWebSocket } from "../../../infra/server/interfaces/ws/IWebSocket";

export interface IWebSocketMessageHandler {
  canHandle(
    messageString: string,
    isBinary: boolean,
    senderSocket: IWebSocket
  ): boolean;

  handle(socket: IWebSocket, data: Buffer, isBinary: boolean): void;
}
