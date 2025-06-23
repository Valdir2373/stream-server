import { UserEntities } from "../entities/User";

export interface IUserRepository {
  getById(id: string): Promise<UserEntities | undefined>;
  getByEmail(email: string): Promise<UserEntities | undefined>;
  saveUser(user: UserEntities): Promise<UserEntities | undefined>;
  deleteUserById(id: string): Promise<number>;
  getAllUsers(): Promise<UserEntities[] | undefined>;
  UpdateUserById(userUpdated: UserEntities): Promise<UserEntities | undefined>;
}
