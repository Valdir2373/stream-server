import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserOutputDTO } from "../DTO/UserOutput";

export class GetAllUsers {
  constructor(private userRepository: IUserRepository) {}
  async execute(): Promise<UserOutputDTO[] | undefined> {
    const allUsers = await this.userRepository.getAllUsers();
    console.log(allUsers);

    if (!allUsers) return;
    const usersOutputList: UserOutputDTO[] = allUsers.map(
      (userEnti: UserEntities) => {
        return {
          email: userEnti.email,
          id: userEnti.id,
          username: userEnti.username,
        };
      }
    );
    return usersOutputList;
  }
}
