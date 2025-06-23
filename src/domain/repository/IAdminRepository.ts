import { UserEntities } from "../entities/User";

export interface IAdminRepository {
  getUserByEmail(email: string): Promise<UserEntities | undefined>;
  saveAdmin(user: UserEntities): Promise<UserEntities | undefined>;
}
