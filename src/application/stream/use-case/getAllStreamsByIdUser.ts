import { StreamEntities } from "../../../domain/entities/Stream";
import { IStreamRepository } from "../../../domain/repository/IStreamRepository";
import { StreamOutputDTO } from "../DTO/streamOutput";

export class GetAllStreamsByIdUser {
  constructor(private streamsRepository: IStreamRepository) {}
  async execute(idUser: string): Promise<StreamOutputDTO[]> {
    const streamsEntities: StreamEntities[] =
      await this.streamsRepository.getStreamByIdUser(idUser);
    const streamsOutput: StreamOutputDTO[] = streamsEntities.map((stream) => {
      return { name: stream.name, id: stream.id };
    });
    return streamsOutput;
  }
}
