import { Server as HttpServer } from "http";
import { IWebSocket } from "./IWebSocket";

export interface IWebSocketServer {
  start(httpServer: HttpServer): void;

  onConnection(callback: (ws: IWebSocket) => void): void;

  onMessage(
    callback: (ws: IWebSocket, data: Buffer, isBinary: boolean) => void
  ): void;

  close(): void;
}
