import { UserEntities } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";
import { UserInputDTO } from "../DTO/UserInput";
import { UserOutputDTO } from "../DTO/UserOutput";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { ICreateId } from "../../../domain/services/ICreateId";

export class UserCreate {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private createId: ICreateId
  ) {}
  async execute(user: UserInputDTO): Promise<UserOutputDTO | undefined> {
    try {
      const hashedPassword = await this.passwordHasher.hash(
        user.userpassword.trim()
      );

      const userEntities: UserEntities = UserEntities.generateEntitie(
        user.username,
        user.useremail,
        hashedPassword,
        this.createId
      );

      const userNew: UserEntities | undefined =
        await this.userRepository.saveUser(userEntities);
      userEntities;

      if (!userNew) return;

      const userOutputNew: UserOutputDTO = {
        id: userNew.id,
        email: userNew.email,
        username: userNew.username,
      };
      return userOutputNew;
    } catch (e) {
      console.error("[ERROR:FATAL] UserCreate: ", e);
    }
  }
}
