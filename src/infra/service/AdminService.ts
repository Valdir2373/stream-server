import { IAdminRepository } from "../../domain/repository/IAdminRepository";
import { CreateAdmin } from "../../application/admin/CreateAdmin";
import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UserEntities } from "../../domain/entities/User";

export class AdminService {
  private createAdmin: CreateAdmin;
  constructor(private AdminRepository: IAdminRepository) {
    this.createAdmin = new CreateAdmin(this.AdminRepository);
  }
  async userToAdmin(email: string): Promise<object> {
    const admin = await this.createAdmin.execute(email);
    if (admin) return { message: "Sucess" };
    return { message: "Failed" };
  }
}
