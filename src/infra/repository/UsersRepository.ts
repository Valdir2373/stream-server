import { UserEntities } from "../../domain/entities/User";
import { IDataAccess } from "../../domain/repository/IDataAccess";
import { IUserRepository } from "../../domain/repository/IUserRepository";

export class UserRepository implements IUserRepository {
  private readonly collectionName = "users";

  private readonly userSelectFields: (keyof UserEntities)[] = [
    "id",
    "username",
    "email",
    "password",
    "verification",
    "created_at",
    "updated_at",
  ];

  constructor(private readonly dataAccess: IDataAccess) {}

  async getById(id: string): Promise<UserEntities | undefined> {
    const rawData = await this.dataAccess.findOne<UserEntities>(
      this.collectionName,
      { id: id },
      this.userSelectFields
    );

    return rawData ? UserEntities.createFromData(rawData) : undefined;
  }

  async getByEmail(email: string): Promise<UserEntities | undefined> {
    const rawData = await this.dataAccess.findOne<UserEntities>(
      this.collectionName,
      { email: email },
      this.userSelectFields
    );

    return rawData ? UserEntities.createFromData(rawData) : undefined;
  }

  async saveUser(user: UserEntities): Promise<UserEntities | undefined> {
    const insertResult = await this.dataAccess.create(
      this.collectionName,
      user
    );

    if (insertResult !== undefined) {
      return user;
    }
    return undefined;
  }

  async deleteUserById(id: string): Promise<number> {
    return await this.dataAccess.remove(this.collectionName, { id: id });
  }

  async getAllUsers(): Promise<UserEntities[] | undefined> {
    const rawUsers = await this.dataAccess.findMany<UserEntities>(
      this.collectionName,
      {},
      this.userSelectFields
    );

    const users = rawUsers.map((rawUser) =>
      UserEntities.createFromData(rawUser)
    );

    return users.length > 0 ? users : undefined;
  }

  async UpdateUserById(user: UserEntities): Promise<UserEntities | undefined> {
    const existingUser = await this.getById(user.id);

    if (existingUser) {
      existingUser.updateFields({
        username: user.username,
        email: user.email,
        password: user.password,
        verification: user.verification,
      });

      const affectedRows = await this.dataAccess.update(
        this.collectionName,
        { id: existingUser.id },
        existingUser
      );

      if (affectedRows > 0) {
        return existingUser;
      }

      return undefined;
    } else {
      return undefined;
    }
  }
}
