import { IServer } from "../../infra/server/interfaces/http/IServer";
import { UsersService } from "../service/UsersService";
import { UsersControllers } from "../controllers/UserController";
import { IDataAccess } from "../../domain/repository/IDataAccess";

import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IEmailService } from "../interfaces/IEmailService";
import { AuthController } from "../controllers/AuthController";
import { StreamModule } from "./StreamModule";
import { ICreateId } from "../../domain/services/ICreateId";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";

export class UsersModule {
  private usersService: UsersService;
  private usersController: UsersControllers;
  private usersSchemas: UsersSchemas;

  constructor(
    private server: IServer,
    private dataAcess: IDataAccess,
    private authTokenManager: IAuthTokenManager,
    private email: IEmailService,
    private createId: ICreateId,
    private passwordHasher: IPasswordHasher,
    private getUsersService: () => UsersService,
    private getUsersSchemas: () => UsersSchemas
  ) {
    this.usersSchemas = this.getUsersSchemas();

    this.usersService = this.getUsersService();

    this.usersController = new UsersControllers(
      this.usersService,
      this.usersSchemas,
      this.email
    );
    this.usersController.mountRoutes(this.server);
    const authController = new AuthController(
      this.server,
      this.authTokenManager,
      this.usersService,
      this.email,
      this.usersSchemas
    );

    new StreamModule(
      authController,
      this.server,
      this.dataAcess,
      this.createId,
      this.passwordHasher
    );
  }
}
