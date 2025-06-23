import { MiddlewareHandler } from "./IMiddlewareHandler";
import { Server } from "http";

export interface IServer {
  registerRouter(
    methodHTTP: string,
    path: string,
    ...handlers: MiddlewareHandler[]
  ): void;
  listen(port: number, callback?: () => void): Server;
  getHttpServer(): Server;
}
