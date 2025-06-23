import { IWebSocket } from "../server/interfaces/ws/IWebSocket";
import { IWebSocketMessageHandler } from "./interfaces/IWebSocketMessageHandler";
import { IClientRegistry } from "../client/interfaces/IClientRegistry";
import { UsersService } from "../service/UsersService";

export interface VisualizerConnectMessageInputDto {
  id: string;
  idStream: string;
  message: "CLIENT_CONNECT";
  socket: IWebSocket;
}

export class ClientVisualizer implements IWebSocketMessageHandler {
  private usersService: UsersService;
  constructor(
    private clientRegistry: IClientRegistry,
    private getUsersService: () => UsersService
  ) {
    this.usersService = getUsersService();
  }

  canHandle(
    messageString: string,
    isBinary: boolean,
    senderSocket: IWebSocket
  ): boolean {
    if (isBinary) return false;

    try {
      const message = JSON.parse(
        messageString
      ) as VisualizerConnectMessageInputDto;

      return message.message === "CLIENT_CONNECT";
    } catch (error) {
      return false;
    }
  }

  async handle(
    socket: IWebSocket,
    data: Buffer,
    isBinary: boolean
  ): Promise<void> {
    const message = data.toString("utf-8");
    const parsedMessage = JSON.parse(message);

    const visualizerConnectMessageInputDto: VisualizerConnectMessageInputDto = {
      id: parsedMessage.id,
      idStream: parsedMessage.idStream,
      message: parsedMessage.message,
      socket: socket,
    };

    console.log(visualizerConnectMessageInputDto);
    const user = await this.usersService.getByIdUser(
      visualizerConnectMessageInputDto.id
    );
    console.log(user);

    if (!user) {
      return socket.send("CLIENT_NEGED");
    }
    this.clientRegistry.registerClient(visualizerConnectMessageInputDto);
    socket.send("CLIENT_OK");
  }
}
