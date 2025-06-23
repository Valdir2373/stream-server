export interface IWebSocket {
  readyState: number;

  send(data: string | Buffer | ArrayBufferLike | Blob | ArrayBufferView): void;

  on(
    event: "message",
    listener: (data: Buffer, isBinary: boolean) => void
  ): void;
  on(event: "close", listener: (code: number, reason: Buffer) => void): void;
  on(event: "error", listener: (error: Error) => void): void;

  close(code?: number, data?: string): void;
}
