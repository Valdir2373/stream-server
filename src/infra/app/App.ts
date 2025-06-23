import { ExpressAdapter } from "../server/implementations/ExpressAdapter";
import { IServer } from "../server/interfaces/http/IServer";
import { UsersModule } from "../modules/UsersModule";
import { ConfigDB } from "../../config/ConfigDB";
import { IDataAccess } from "../../domain/repository/IDataAccess";
import { JsonwebtokenAuthTokenManager } from "../security/JwtAuthService";
import { ViewModule } from "../modules/ViewModule";
import { ZodDTOBuilderAndValidator } from "../../shared/validator/ZodDTOBuilderAndValidatorImpl";
import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IUserLogin } from "../interfaces/IUserLogin";
import { IDatabaseHandler } from "../../domain/repository/IDatabaseHandler";
import { MongooseHandler } from "../database/MongooseHandler";
import { MongooseDataAccess } from "../database/MoongoseDataAcess";
import mongoose from "mongoose";
import { NodemailerEmailService } from "../email/NodemailerEmailService";
import { createTransport } from "nodemailer";
import { IEmailService } from "../interfaces/IEmailService";
import { AdminModule } from "../modules/AdminModule";

import { WsWebSocketServerAdapter } from "../server/implementations/ws/WebSocketAdapter";
import { IWebSocketServer } from "../server/interfaces/ws/IWebSocketServer";
import { Server as HttpServer } from "http";

import { IClientRegistry } from "../client/interfaces/IClientRegistry";
import { ClientRegistry } from "../client/ClientRegistry";
import { IWebSocketMessageHandler } from "../handlers/interfaces/IWebSocketMessageHandler";
import { ClientVisualizer } from "../handlers/ClientVisualizer";
import { CaptureClientConnectHandler } from "../handlers/CaptureClientConnectHandler";
import { ImageRelayHandler } from "../handlers/ImageRelayHandler";
import { UnexpectedMessageHandler } from "../handlers/UnexpectedMessageHandler";
import { WebSocketMessageRouter } from "../server/implementations/ws/WebSocketMessageRouter";
import { CreateIdImpl } from "../../shared/utils/CreateId";
import { ICreateId } from "../../domain/services/ICreateId";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { BcryptPasswordHasher } from "../security/BcryptPasswordHasher";
import { UsersService } from "../service/UsersService";
import { UserRepository } from "../repository/UsersRepository";

export class AppModule {
  private configDB: ConfigDB;
  private dbHandler: IDatabaseHandler<mongoose.Mongoose>;
  private dataAccess: IDataAccess;
  private authTokenManager: IAuthTokenManager;
  private email: IEmailService;
  private createId: ICreateId;
  private passwordHasher: IPasswordHasher;
  private server: IServer;
  private webServer: IWebSocketServer;

  private clientRegistry: IClientRegistry;
  private webSocketRouter: WebSocketMessageRouter;

  constructor() {
    this.configDB = new ConfigDB();
    this.dbHandler = new MongooseHandler(this.configDB.getConfigDB());
    this.dataAccess = new MongooseDataAccess(this.dbHandler);

    this.authTokenManager = new JsonwebtokenAuthTokenManager();
    this.email = new NodemailerEmailService(
      createTransport,
      this.authTokenManager
    );

    this.createId = new CreateIdImpl();
    this.passwordHasher = new BcryptPasswordHasher();

    this.server = new ExpressAdapter();

    this.clientRegistry = new ClientRegistry();

    const clientVisualizer = new ClientVisualizer(
      this.clientRegistry,
      this.getUsersService.bind(this)
    );
    const captureClientConnectHandler = new CaptureClientConnectHandler(
      this.clientRegistry
    );
    const imageRelayHandler = new ImageRelayHandler(this.clientRegistry);
    const unexpectedMessageHandler = new UnexpectedMessageHandler();

    const messageHandlers: IWebSocketMessageHandler[] = [
      clientVisualizer,
      captureClientConnectHandler,
      imageRelayHandler,
      unexpectedMessageHandler,
    ];
    this.webSocketRouter = new WebSocketMessageRouter(messageHandlers);

    this.webServer = new WsWebSocketServerAdapter();
  }

  private injectDepenciesOnSchemas() {
    const validatorUserInputDto = new ZodDTOBuilderAndValidator<UserInputDTO>();
    const validatorUserLogin = new ZodDTOBuilderAndValidator<IUserLogin>();
    return new UsersSchemas(validatorUserInputDto, validatorUserLogin);
  }

  private Modules() {
    new UsersModule(
      this.server,
      this.dataAccess,
      this.authTokenManager,
      this.email,
      this.createId,
      this.passwordHasher,
      this.getUsersService.bind(this),
      this.injectDepenciesOnSchemas
    );
    new ViewModule(this.server);
    new AdminModule(
      this.server,
      this.dataAccess,
      this.injectDepenciesOnSchemas
    );
  }

  public async listen(port: number): Promise<void> {
    this.Modules();

    const httpServerInstance: HttpServer = this.server.listen(
      port
    ) as HttpServer;

    this.webServer.start(httpServerInstance);

    // this.webServer.onConnection((socket) => {});  <- trabalhar futuramente para gerenciar, desconexões
    this.webServer.onMessage((socket, data, isBinary) => {
      this.webSocketRouter.route(socket, data, isBinary);
    });

    console.log(`Servidor HTTP ouvindo na porta ${port}`);
    console.log(`Servidor WebSocket integrado e rodando.`);

    process.on("SIGTERM", async () => {
      console.log("SIGTERM recebido. Fechando pool de DB e servidores...");
      await this.gracefulShutdown(httpServerInstance);
    });
    process.on("SIGINT", async () => {
      console.log("SIGINT recebido. Fechando pool de DB e servidores...");
      await this.gracefulShutdown(httpServerInstance);
    });
  }

  private async gracefulShutdown(httpServer: HttpServer): Promise<void> {
    this.webServer.close();
    console.log("Servidor WebSocket fechado.");

    httpServer.close(async () => {
      console.log("Servidor HTTP fechado.");

      if (this.dbHandler) {
        await this.dbHandler.closePool();
        console.log("Pool de DB fechado.");
      }
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forçando desligamento após timeout de 10 segundos.");
      process.exit(1);
    }, 10000);
  }

  private getUsersService(): UsersService {
    const usersRepository = new UserRepository(this.dataAccess);
    const usersService = new UsersService(
      usersRepository,
      this.createId,
      this.passwordHasher
    );
    return usersService;
  }
}
