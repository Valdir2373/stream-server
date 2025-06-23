// src/infra/server/interfaces/ws/IWebSocketClient.ts

export interface IWebSocketClient {
  connect(url: string): Promise<void>;
  disconnect(): void;
  onMessage(callback: (data: string | Buffer) => void): void;
  send(data: string | Buffer): void;
}
