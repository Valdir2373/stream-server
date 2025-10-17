import { IWebSocket } from "../../server/interfaces/ws/IWebSocket";

export interface IClientCapture {
  socket: IWebSocket;
  password: string;
}
