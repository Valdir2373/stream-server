export interface IServerWS {
  broadcast(message: string | Buffer): void;
}
