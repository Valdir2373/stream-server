import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class VerifyUserByEmail {
  constructor(private userRepository: IUserRepository) {}
  async execute(email: string): Promise<boolean> {
    const user: UserEntities | undefined = await this.userRepository.getByEmail(
      email
    );
    if (!user) throw new Error("User not found");
    if (true === user.verification) return true;
    return false;
  }
}
