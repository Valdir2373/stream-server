import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserOutputDTO } from "../DTO/UserOutput";

export class GetUserById {
  constructor(private usersRepository: IUserRepository) {}
  async execute(id: string): Promise<UserOutputDTO | undefined> {
    const outPutRepository = await this.usersRepository.getById(id);
    if (!outPutRepository) return;
    const user: UserEntities = outPutRepository;

    const userById: UserOutputDTO = {
      username: user.username,
      email: user.email,
      id: user.id,
    };
    return userById;
  }
}
