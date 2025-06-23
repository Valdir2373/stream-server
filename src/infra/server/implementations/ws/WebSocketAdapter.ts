// src/infra/server/implementations/WebSocketAdapter.ts

import { IWebSocketServer } from "../../interfaces/ws/IWebSocketServer";
import { IWebSocket } from "../../interfaces/ws/IWebSocket";
import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";

export class WsWebSocketServerAdapter implements IWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connectionCallbacks: ((ws: IWebSocket) => void)[] = [];
  private messageCallbacks: ((
    ws: IWebSocket,
    data: Buffer,
    isBinary: boolean
  ) => void)[] = [];

  constructor() {}

  start(httpServer: HttpServer): void {
    if (this.wss) {
      console.warn("WSAdapter: WebSocketServer já iniciado.");
      return;
    }

    // CORRIGIDO: Adiciona a opção 'path' para filtrar as conexões WebSocket
    this.wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WSAdapter: Nova conexão estabelecida.");
      const adaptedWs: IWebSocket = ws as IWebSocket;

      this.connectionCallbacks.forEach((callback) => callback(adaptedWs));

      ws.on("message", (data: Buffer, isBinary: boolean) => {
        this.messageCallbacks.forEach((callback) =>
          callback(adaptedWs, data, isBinary)
        );
      });

      ws.on("close", (code: number, reason: Buffer) => {
        console.log(
          `WSAdapter: Cliente desconectado. Código: ${code}, Razão: ${reason.toString()}`
        );
      });

      ws.on("error", (error: Error) => {
        console.error("WSAdapter: Erro no WebSocket:", error);
      });
    });

    this.wss.on("error", (error: Error) => {
      console.error("WSAdapter: Erro no WebSocketServer:", error);
    });

    console.log(
      "WSAdapter: WebSocketServer está pronto para aceitar conexões no caminho /ws."
    );
  }

  onConnection(callback: (ws: IWebSocket) => void): void {
    this.connectionCallbacks.push(callback);
  }

  onMessage(
    callback: (ws: IWebSocket, data: Buffer, isBinary: boolean) => void
  ): void {
    this.messageCallbacks.push(callback);
  }

  close(): void {
    if (this.wss) {
      this.wss.close(() => {
        console.log("WSAdapter: WebSocketServer fechado.");
        this.wss = null;
      });
    }
  }
}
