import { IRequest } from "../server/interfaces/http/IRequest";
import { IResponse } from "../server/interfaces/http/IResponse";
import { UsersService } from "../service/UsersService";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { IServer } from "../server/interfaces/http/IServer";

import { UsersSchemas } from "../../schemas/UsersSchemas";
import { IEmailService } from "../interfaces/IEmailService";

export class UsersControllers {
  constructor(
    private userService: UsersService,
    private usersSchemas: UsersSchemas,
    private email: IEmailService
  ) {}

  public async mountRoutes(server: IServer) {
    server.registerRouter("post", "/register", this.createUser.bind(this));
    server.registerRouter("get", "/users", this.allUsers.bind(this));
    server.registerRouter(
      "delete",
      "/users/delete/:id",
      this.deleteUserID.bind(this)
    );
    server.registerRouter(
      "get",
      "/users/email/:email",
      this.getUserEmail.bind(this)
    );
    server.registerRouter("get", "/users/id/:id", this.getUserId.bind(this));
  }

  private async createUser(req: IRequest, res: IResponse): Promise<any> {
    try {
      const inputData = req.body;
      console.log(inputData);

      if (!inputData)
        return res.status(401).json({ ERROR: "user field not found " });

      this.usersSchemas.usersInputValidator(inputData);

      const userOutput: UserOutputDTO = await this.userService.createNewUser(
        inputData
      );

      await this.email.sendEmailVerificationUser(userOutput);
      return res.status(201).json(userOutput);
    } catch (e: any) {
      if (e.message === "Erro de validação do DTO") return;

      if (e.message === "Usuário com este email já existe.")
        return res.status(401).json({ message: e.message });

      console.error(e);
    }
  }

  private async allUsers(req: IRequest, res: IResponse): Promise<any> {
    const usersOutputList: UserOutputDTO[] | undefined =
      await this.userService.getAllUsers();
    res.json(usersOutputList);
  }

  private async deleteUserID(req: IRequest, res: IResponse): Promise<any> {
    const response = await this.userService.deleteUser(req.params.id);

    if (response) return res.status(200).json(response);
    res.status(401).json({ message: "BAD__REQUEST" });
  }

  private async getUserId(req: IRequest, res: IResponse): Promise<any> {
    const response = await this.userService.getByIdUser(req.params.id);
    if (response) return res.status(200).json(response);
    res.status(401).json({ message: "BAD__REQUEST" });
  }

  private async getUserEmail(req: IRequest, res: IResponse): Promise<any> {
    const response = await this.userService.getByEmailUser(req.params.email);
    if (response) return res.status(200).json(response);
    res.status(401).json({ message: "BAD__REQUEST" });
  }
}
