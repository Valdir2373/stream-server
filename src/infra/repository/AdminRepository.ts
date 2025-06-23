import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UserEntities } from "../../domain/entities/User";
import { IAdminRepository } from "../../domain/repository/IAdminRepository";
import { IDataAccess } from "../../domain/repository/IDataAccess";

export class AdminRepository implements IAdminRepository {
  private readonly collectionName = "users";
  private readonly userSelectFields: (keyof UserEntities)[] = [
    "id",
    "username",
    "email",
    "password",
    "verification",
    "adm",
    "created_at",
    "updated_at",
  ];

  constructor(private dataAcess: IDataAccess) {}
  public async getUserByEmail(
    email: string
  ): Promise<UserEntities | undefined> {
    return await this.dataAcess.findOne<UserEntities>(
      this.collectionName,
      { email: email },
      this.userSelectFields
    );
  }
  public async saveAdmin(
    user: UserEntities
  ): Promise<UserEntities | undefined> {
    user.updateFields({
      adm: true,
    });
    const affectedRows = await this.dataAcess.update(
      this.collectionName,
      { id: user.id },
      user
    );
    if (affectedRows > 0) {
      return user;
    }
    return undefined;
  }
}
