import { StreamEntities } from "../../../domain/entities/Stream";
import { IStreamRepository } from "../../../domain/repository/IStreamRepository";
import { ICreateId } from "../../../domain/services/ICreateId";
import { StreamInputDTO } from "../DTO/streamInput";

export class CreateStream {
  constructor(
    private streamRepository: IStreamRepository,
    private createID: ICreateId
  ) {}
  async execute(streamInput: StreamInputDTO, idUser: string): Promise<any> {
    const streamEntities = StreamEntities.generateStream(
      streamInput.name,
      streamInput.password,
      idUser,
      this.createID
    );
    return (await this.streamRepository.save(streamEntities)).id;
  }
}
