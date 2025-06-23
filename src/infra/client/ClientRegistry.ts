import { IClientRegistry } from "./interfaces/IClientRegistry";
import { IWebSocket } from "../../infra/server/interfaces/ws/IWebSocket";
import { VisualizerConnectMessageInputDto } from "../handlers/ClientVisualizer";

export class ClientRegistry implements IClientRegistry {
  private streamsClients: Map<string, IWebSocket> = new Map();

  private visualizerClients: Map<
    string,
    { socket: IWebSocket; stream: string }
  > = new Map();

  registerClient(
    visualizerConnectMessageInputDto: VisualizerConnectMessageInputDto
  ): void {
    this.visualizerClients.set(visualizerConnectMessageInputDto.id, {
      socket: visualizerConnectMessageInputDto.socket,
      stream: visualizerConnectMessageInputDto.idStream,
    });
    const socket = visualizerConnectMessageInputDto.socket;

    socket.on("close", () => {
      this.unregisterClient(visualizerConnectMessageInputDto.id);
    });
  }

  getClient(idStream: string): IWebSocket | undefined {
    for (const client of this.visualizerClients) {
      if (client[1].stream === idStream) {
        return client[1].socket;
      }
    }
  }

  unregisterClient(id: string): void {
    for (const client of this.visualizerClients) {
      if (client[0] === id) {
        this.visualizerClients.delete(client[0]);
        return;
      }
    }
  }

  registerCaptureClient(socket: IWebSocket, id: string): void {
    this.streamsClients.set(id, socket);
    console.log("[ClientRegistry] Cliente de captura registrado.");

    socket.on("close", () => {
      this.unregisterCaptureClient(id);
    });
  }

  getCaptureClient(id: string): IWebSocket | undefined {
    return this.streamsClients.get(id);
  }

  unregisterCaptureClient(id: string): void {
    for (const caputure of this.streamsClients) {
      if (caputure[0] === id) {
        this.streamsClients.delete(caputure[0]);
        console.log("[ClientRegistry] Cliente de captura desregistrado.");
      }
    }
  }
}
