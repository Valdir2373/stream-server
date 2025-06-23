import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserInputDTO } from "../DTO/UserInput";
import { UserOutputDTO } from "../DTO/UserOutput";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";

export class UpdateUserByEmail {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}
  async execute(userInput: UserInputDTO): Promise<UserOutputDTO | undefined> {
    const userEntity: UserEntities | undefined =
      await this.userRepository.getByEmail(userInput.useremail);

    const hashedPassword = await this.passwordHasher.hash(
      userInput.userpassword
    );

    if (!userEntity) return;
    const userToUpdate = new UserEntities(
      userInput.username,
      userInput.useremail,
      hashedPassword,
      userEntity.id,
      userEntity.verification,
      false,
      userEntity.created_at,
      userEntity.updated_at
    );

    const userUpdated = await this.userRepository.UpdateUserById(userToUpdate);
    if (!userUpdated) return;
    return {
      username: userUpdated.username,
      email: userUpdated.email,
      id: userUpdated.id,
    };
  }
}
