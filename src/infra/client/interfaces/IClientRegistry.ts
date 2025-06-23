import { IWebSocket } from "../../../infra/server/interfaces/ws/IWebSocket";
import { VisualizerConnectMessageInputDto } from "../../handlers/ClientVisualizer";
import { IClient } from "./IClients";

export interface IClientRegistry {
  registerClient(
    visualizerConnectMessageInputDto: VisualizerConnectMessageInputDto
  ): void;
  getClient(idStream: string): IWebSocket | undefined;
  unregisterClient(id: string): void;

  registerCaptureClient(socket: IWebSocket, id: string): void;
  getCaptureClient(id: string): IWebSocket | undefined;
  unregisterCaptureClient(id: string): void;
}
