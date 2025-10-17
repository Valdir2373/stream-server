import { StreamInputDTO } from "../../application/stream/DTO/streamInput";
import { ICreateId } from "../../domain/services/ICreateId";
import { CreateStream } from "../../application/stream/use-case/createStream";
import { GetAllStreamsByIdUser } from "../../application/stream/use-case/getAllStreamsByIdUser";
import { IStreamRepository } from "../../domain/repository/IStreamRepository";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { StreamOutputDTO } from "../../application/stream/DTO/streamOutput";
import { CompileGoToExe } from "../../application/stream/use-case/CompileGoToExe";
import { GetStreamByName } from "../../application/stream/use-case/GetStreamByName";
import { DeleteStreamById } from "../../application/stream/use-case/DeleteStreamById";
import { StreamEntities } from "../../domain/entities/Stream";

export class StreamService {
  private createStream: CreateStream;
  private getAllStreamsByIdUser: GetAllStreamsByIdUser;
  private compileGoToExe: CompileGoToExe;
  private getStreamByName: GetStreamByName;
  private deleteStreamById: DeleteStreamById;

  constructor(
    private streamRepository: IStreamRepository,
    private createId: ICreateId,
    private passwordHash: IPasswordHasher
  ) {
    this.getAllStreamsByIdUser = new GetAllStreamsByIdUser(
      this.streamRepository
    );
    this.getStreamByName = new GetStreamByName(this.streamRepository);
    this.createStream = new CreateStream(this.streamRepository, this.createId);
    this.deleteStreamById = new DeleteStreamById(this.streamRepository);
    this.compileGoToExe = new CompileGoToExe();
  }
  async saveStream(streamInput: StreamInputDTO, idUser: string): Promise<any> {
    const stream: StreamInputDTO = {
      name: streamInput.name,
      password: await this.passwordHash.hash(streamInput.password.trim()),
    };

    const streamEntitie: StreamEntities = await this.createStream.execute(
      stream,
      idUser
    );

    return await this.compileGoToExeWithStream(idUser, streamEntitie);
  }
  async getAllStreams(idUser: string): Promise<StreamOutputDTO[]> {
    return await this.getAllStreamsByIdUser.execute(idUser);
  }
  async compileGoToExeWithStream(idUser: string, stream: StreamEntities) {
    return await this.compileGoToExe.execute(idUser, stream);
  }
  async getStreamByNameRepository(name: string, idUser: string) {
    return await this.getStreamByName.execute(name, idUser);
  }
  async deteStreamByIdFromRepository(id: string) {
    await this.deleteStreamById.execute(id);
    return { message: "deleted stream success" };
  }
  async getStreamIdByName(nameStream: string, idUser: string): Promise<any> {
    const allStreams = await this.getAllStreamsByIdUser.execute(idUser);
    const stream = allStreams.find((stream) => stream.name === nameStream);
    if (!stream) return;
    return stream.id;
  }
}
