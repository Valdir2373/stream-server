import { IDataAccess } from "../../domain/repository/IDataAccess";
import { ICreateId } from "../../domain/services/ICreateId";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { AuthController } from "../controllers/AuthController";
import { StreamController } from "../controllers/StreamController";
import { StreamRepository } from "../repository/StreamRepository";
import { IServer } from "../server/interfaces/http/IServer";
import { StreamService } from "../service/StreamService";

export class StreamModule {
  constructor(
    private authController: AuthController,
    private server: IServer,
    private dataAcess: IDataAccess,
    private createId: ICreateId,
    private passwordHash: IPasswordHasher
  ) {
    const streamRepository = new StreamRepository(this.dataAcess);
    const streamService = new StreamService(
      streamRepository,
      this.createId,
      this.passwordHash
    );
    const streamController = new StreamController(
      this.authController,
      streamService
    );
    streamController.mountRouter(this.server);
  }
}
