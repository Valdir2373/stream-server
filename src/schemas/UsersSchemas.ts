import { UserInputDTO } from "../application/users/DTO/UserInput";
import { IUserLogin } from "../infra/interfaces/IUserLogin";
import { ValidationError } from "../shared/error/ValidationError";
import { IDTOBuilderAndValidator } from "../shared/validator/IFieldsValidator";

export class UsersSchemas {
  constructor(
    private userDtoSchemas: IDTOBuilderAndValidator<UserInputDTO>,
    private userLoginSchemas: IDTOBuilderAndValidator<IUserLogin>
  ) {}
  public get schemasUserDto() {
    return this.userDtoSchemas.defineSchema(
      {
        name: "useremail",
        type: "string",
        required: true,
        email: true,
        emailMessage: "O formato do useremail é inválido.",
        message: "O useremail é obrigatório.",
      },
      {
        name: "username",
        type: "string",
        required: true,
        minLength: 3,
        maxLength: 15,
        message: "O username é obrigatório e não pode exceder 10 caracteres.",
      },
      {
        name: "userpassword",
        type: "string",
        required: true,
        maxLength: 20,
        minLength: 6,
        message:
          "O userpassword é obrigatório e não pode exceder 20 caracteres.",
      }
    );
  }
  public get schemasUserLogin() {
    return this.userLoginSchemas.defineSchema(
      {
        name: "useremail",
        type: "string",
        required: true,
        email: true,
        emailMessage: "O formato do useremail é inválido.",
        message: "O useremail é obrigatório.",
      },
      {
        name: "userpassword",
        type: "string",
        required: true,
        maxLength: 20,
        minLength: 6,
        message:
          "O userpassword é obrigatório e não pode exceder 15 caracteres.",
      }
    );
  }

  public usersInputValidator(inputUser: UserInputDTO): void {
    try {
      this.schemasUserDto.validate(inputUser);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else {
        console.error(
          "Um erro inesperado ocorreu na validação:",
          error.message
        );
        throw new Error("Erro inesperado na validação.");
      }
    }
  }
}
