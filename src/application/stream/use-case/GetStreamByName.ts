import { IStreamRepository } from "../../../domain/repository/IStreamRepository";

export class GetStreamByName {
  constructor(private streamRepository: IStreamRepository) {}
  async execute(name: string, idUser: string) {
    const allStreams = await this.streamRepository.getStreamByIdUser(idUser);
    for (const stream of allStreams) {
      if (stream.name === name) {
        return stream;
      }
    }
  }
}
