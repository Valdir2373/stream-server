import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IRequest } from "../server/interfaces/http/IRequest";
import { IResponse } from "../server/interfaces/http/IResponse";
import { IServer } from "../server/interfaces/http/IServer";
import { AdminService } from "../service/AdminService";

export class AdminController {
  constructor(
    private adminService: AdminService,
    private userSchemas: UsersSchemas
  ) {}
  public mountRouter(server: IServer) {
    server.registerRouter("post", "/createAdmin", this.createAdmin.bind(this));
  }
  private async createAdmin(req: IRequest, res: IResponse) {
    const { email } = req.body;
    const message = await this.adminService.userToAdmin(email);
    res.status(200).json(message);
  }
}
