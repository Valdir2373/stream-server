import { IUserRepository } from "../../domain/repository/IUserRepository";
import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { DeleteByIdUser } from "../../application/users/use-case/DeleteByIdUser";
import { GetAllUsers } from "../../application/users/use-case/GetAllUsers";
import { GetUserByEmail } from "../../application/users/use-case/GetUserByEmail";
import { GetUserById } from "../../application/users/use-case/GetUserById";
import { UpdateUserByEmail } from "../../application/users/use-case/UpdateUser";
import { UserCreate } from "../../application/users/use-case/UserCreate";
import { LoginUser } from "../../application/users/use-case/LoginUser";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { ICreateId } from "../../domain/services/ICreateId";
import { VerifyUserByEmail } from "../../application/users/use-case/VerifyUserByEmail";
import { UserAlreadyExistsError } from "../../shared/error/UserAlreadyExistsError";
import { IUserLogin } from "../interfaces/IUserLogin";
import { AuthenticateUserByEmail } from "../../application/users/use-case/AuthenticateUserByEmail";

export class UsersService {
  private usersRepository: IUserRepository;
  private userCreate: UserCreate;
  private getAllUsersUseCase: GetAllUsers;
  private deleteByIdUser: DeleteByIdUser;
  private getUserByEmail: GetUserByEmail;
  private getUserById: GetUserById;
  private updateUserByEmailUseCase: UpdateUserByEmail;
  private loginUser: LoginUser;
  private verifyUserByEmailUseCase: VerifyUserByEmail;
  authenticateUserByEmail: AuthenticateUserByEmail;

  constructor(
    readonly UsersRepository: IUserRepository,
    private createId: ICreateId,
    private passwordHasher: IPasswordHasher
  ) {
    this.usersRepository = UsersRepository;
    this.userCreate = new UserCreate(
      this.usersRepository,
      this.passwordHasher,
      this.createId
    );
    this.getAllUsersUseCase = new GetAllUsers(this.UsersRepository);
    this.deleteByIdUser = new DeleteByIdUser(this.UsersRepository);
    this.getUserByEmail = new GetUserByEmail(this.usersRepository);
    this.getUserById = new GetUserById(this.usersRepository);
    this.updateUserByEmailUseCase = new UpdateUserByEmail(
      this.usersRepository,
      this.passwordHasher
    );
    this.verifyUserByEmailUseCase = new VerifyUserByEmail(this.usersRepository);
    this.authenticateUserByEmail = new AuthenticateUserByEmail(
      this.usersRepository
    );
    this.loginUser = new LoginUser(this.usersRepository, this.passwordHasher);
  }

  async createNewUser(user: UserInputDTO): Promise<UserOutputDTO> {
    try {
      if (await this.getByEmailUser(user.useremail))
        throw new UserAlreadyExistsError("Usuário com este email já existe.");
    } catch (e: any) {
      if (
        e.message !== "user not found"
        // e.message !== "Usuário com este email já existe."
      )
        throw e;
    }

    try {
      const newUser: UserOutputDTO | undefined = await this.userCreate.execute(
        user
      );
      if (!newUser) {
        console.error("Erro: userCreate.execute não retornou um novo usuário.");

        throw new Error("Erro ao criar novo usuário: retorno vazio.");
      }

      return {
        email: newUser.email,
        username: newUser.username,
        id: newUser.id,
      };
    } catch (error: any) {
      console.error(
        "Um erro ocorreu durante a criação do usuário:",
        error.message
      );
      throw new Error("Erro interno ao criar usuário.");
    }
  }
  async sendVerificationEmail(email: string) {}
  async getAllUsers(): Promise<UserOutputDTO[] | undefined> {
    return this.getAllUsersUseCase.execute();
  }
  async deleteUser(id: string): Promise<any> {
    return await this.deleteByIdUser.execute(id);
  }
  async getByIdUser(id: string): Promise<UserOutputDTO | undefined> {
    return await this.getUserById.execute(id);
  }
  async getByEmailUser(email: string): Promise<UserOutputDTO | undefined> {
    return await this.getUserByEmail.execute(email);
  }

  async updateUserByEmail(
    user: UserInputDTO
  ): Promise<UserOutputDTO | undefined> {
    return await this.updateUserByEmailUseCase.execute(user);
  }
  async loginUserService(
    userLogin: IUserLogin
  ): Promise<string | UserOutputDTO> {
    const userOutput = await this.getByEmailUser(userLogin.useremail);

    if (!userOutput) return "User not found";

    const user = this.convertDtoOuputToInput(
      userOutput,
      userLogin.userpassword
    );

    const login: undefined | UserOutputDTO | string =
      await this.loginUser.execute(user);

    if (!login) return "User not found";
    return login;
  }
  private convertDtoOuputToInput(
    userOutput: UserOutputDTO,
    pass: string
  ): UserInputDTO {
    const user: UserInputDTO = {
      useremail: userOutput.email,
      username: userOutput.username,
      userpassword: pass,
    };
    return user;
  }
  public async verifyUserByEmail(email: string): Promise<boolean> {
    return await this.verifyUserByEmailUseCase.execute(email);
  }
  public async authenticateUser(email: string): Promise<boolean> {
    return await this.authenticateUserByEmail.execute(email);
  }
}
