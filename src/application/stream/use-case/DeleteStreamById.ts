import { IStreamRepository } from "../../../domain/repository/IStreamRepository";

export class DeleteStreamById {
  constructor(private streamRepository: IStreamRepository) {
    this.streamRepository = streamRepository;
  }

  async execute(id: string): Promise<void> {
    await this.streamRepository.deleteStreamById(id);
  }
}
