import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class AuthenticateUserByEmail {
  constructor(private userRepository: IUserRepository) {}
  async execute(email: string): Promise<boolean> {
    const user = await this.userRepository.getByEmail(email);
    if (!user) {
      return false;
    }
    const userToUpdate: UserEntities = new UserEntities(
      user.username,
      user.email,
      user.password,
      user.id,
      true,
      false,
      user.created_at,
      user.updated_at
    );
    const a = await this.userRepository.UpdateUserById(userToUpdate);
    console.log(a);

    return true;
  }
}
