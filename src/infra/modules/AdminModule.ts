import { IDataAccess } from "../../domain/repository/IDataAccess";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { AdminController } from "../controllers/AdminController";
import { AdminRepository } from "../repository/AdminRepository";
import { IServer } from "../server/interfaces/http/IServer";
import { AdminService } from "../service/AdminService";

export class AdminModule {
  constructor(
    server: IServer,
    dataAcess: IDataAccess,
    private getUsersSchemas: () => UsersSchemas
  ) {
    const adminRepository = new AdminRepository(dataAcess);
    const adminService = new AdminService(adminRepository);
    const userSchemas = this.getUsersSchemas();
    const adminController = new AdminController(adminService, userSchemas);
    adminController.mountRouter(server);
  }
}
