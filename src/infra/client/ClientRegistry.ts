import { IClientRegistry } from "./interfaces/IClientRegistry";
import { IWebSocket } from "../../infra/server/interfaces/ws/IWebSocket";
import { VisualizerConnectMessageInputDto } from "../handlers/ClientVisualizer";
import { IClientCapture } from "./interfaces/ClientCapture";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";

export interface VisualizerClient {
  socket: IWebSocket;
  stream: string;
  password: string;
}

export class ClientRegistry implements IClientRegistry {
  constructor(private passHash: IPasswordHasher) {}
  private streamsClients: Map<string, IClientCapture> = new Map();

  private visualizerClients: Map<string, VisualizerClient> = new Map();

  registerClient(
    visualizerConnectMessageInputDto: VisualizerConnectMessageInputDto
  ): void {
    this.visualizerClients.set(visualizerConnectMessageInputDto.id, {
      socket: visualizerConnectMessageInputDto.socket,
      stream: visualizerConnectMessageInputDto.idStream,
      password: visualizerConnectMessageInputDto.password,
    });
    const socket = visualizerConnectMessageInputDto.socket;

    socket.on("close", () => {
      this.unregisterClient(visualizerConnectMessageInputDto.id);
    });
  }

  getClientVisualizer(idUser: string): VisualizerClient | undefined {
    return this.visualizerClients.get(idUser);
  }

  getClient(idStream: string): IWebSocket | undefined {
    for (const client of this.visualizerClients) {
      if (client[1].stream === idStream) {
        return client[1].socket;
      }
    }
  }

  async verifyPasswordOfUserWithStream(
    passwordOfUser: string,
    idStream: string
  ): Promise<boolean> {
    const stream = this.streamsClients.get(idStream);
    if (stream) {
      return await this.passHash.compare(passwordOfUser, stream.password);
    }
    return false;
  }

  unregisterClient(id: string): void {
    for (const client of this.visualizerClients) {
      if (client[0] === id) {
        this.visualizerClients.delete(client[0]);
        return;
      }
    }
  }

  registerCaptureClient(
    socket: IWebSocket,
    id: string,
    password: string
  ): void {
    // estou passando a senha no parametro e desejo salvar junto no this.streamsClients
    this.streamsClients.set(id, { socket, password }); // quero passar a senha junto...
    console.log("[ClientRegistry] Cliente de captura registrado com a senha.");

    socket.on("close", () => {
      this.unregisterCaptureClient(id);
    });
  }

  getCaptureClient(id: string): IWebSocket | undefined {
    const stream = this.streamsClients.get(id);
    return stream?.socket;
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
