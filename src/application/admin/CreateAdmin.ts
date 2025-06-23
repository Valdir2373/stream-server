import { UserEntities } from "../../domain/entities/User";
import { IAdminRepository } from "../../domain/repository/IAdminRepository";

export class CreateAdmin {
  constructor(private adminRepository: IAdminRepository) {}
  async execute(email: string): Promise<UserEntities | undefined> {
    const user = await this.adminRepository.getUserByEmail(email);
    if (!user) return user;

    const userEntities = new UserEntities(
      user.username,
      user.email,
      user.password,
      user.id,
      user.verification,
      user.adm,
      user.created_at,
      user.updated_at
    );

    const admin = await this.adminRepository.saveAdmin(userEntities);
    if (admin) return admin;
  }
}
