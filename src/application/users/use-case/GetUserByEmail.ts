import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserOutputDTO } from "../DTO/UserOutput";

export class GetUserByEmail {
  constructor(private usersRepository: IUserRepository) {}
  async execute(email: string): Promise<UserOutputDTO | undefined> {
    const outputRepository = await this.usersRepository.getByEmail(email);

    if (!outputRepository) throw new Error("user not found");
    const user: UserEntities = outputRepository;
    const userByEmail: UserOutputDTO = {
      username: user.username,
      email: user.email,
      id: user.id,
    };
    return userByEmail;
  }
}
