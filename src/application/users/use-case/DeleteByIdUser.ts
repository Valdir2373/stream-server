import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class DeleteByIdUser {
  constructor(private usersRepository: IUserRepository) {}
  async execute(id: string): Promise<any> {
    const response = await this.usersRepository.deleteUserById(id);
    if (response === 1) return { message: "usuario deletado" };
    return;
  }
}
