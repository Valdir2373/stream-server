import { IWebSocketMessageHandler } from "../../../handlers/interfaces/IWebSocketMessageHandler";
import { IWebSocket } from "../../interfaces/ws/IWebSocket";

export class WebSocketMessageRouter {
  private handlers: IWebSocketMessageHandler[];

  constructor(handlers: IWebSocketMessageHandler[]) {
    this.handlers = this.sortHandlers(handlers);
  }

  private sortHandlers(
    handlers: IWebSocketMessageHandler[]
  ): IWebSocketMessageHandler[] {
    return handlers.sort((a, b) => {
      if (a.constructor.name === "UnexpectedMessageHandler") return 1;
      if (b.constructor.name === "UnexpectedMessageHandler") return -1;
      return 0;
    });
  }

  async route(
    socket: IWebSocket,
    data: Buffer,
    isBinary: boolean
  ): Promise<void> {
    const messageString = isBinary ? "[BINARY_DATA]" : data.toString("utf8");

    let handlerFound = false;
    for (const handler of this.handlers) {
      if (handler.canHandle(messageString, isBinary, socket)) {
        // console.log(
        //   `[WebSocketMessageRouter] Roteando ${
        //     isBinary ? "mensagem binária" : "mensagem"
        //   } para: ${handler.constructor.name}`
        // );

        handler.handle(socket, data, isBinary);
        handlerFound = true;
        break;
      }
    }

    if (!handlerFound) {
      // console.warn(
      //   `[WebSocketMessageRouter] Nenhum handler encontrado para ${
      //     isBinary ? "mensagem binária" : "mensagem"
      //   } de tamanho: ${data.length} bytes`
      // );
    }
  }
}
