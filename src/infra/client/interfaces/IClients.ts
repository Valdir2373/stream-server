import { IWebSocket } from "../../server/interfaces/ws/IWebSocket";

export interface IClientStreams {
  id: string;
  streamClient: IWebSocket;
  idUser: string;
}

export interface IClientVisualizer {
  idStream: string;
  idVisualizer: string;
  visualizerClient: IWebSocket;
}

export interface IClient {
  socket: IWebSocket;
  id: string;
}
