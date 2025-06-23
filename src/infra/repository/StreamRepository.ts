import { StreamEntities } from "../../domain/entities/Stream";
import { IDataAccess } from "../../domain/repository/IDataAccess";
import { IStreamRepository } from "../../domain/repository/IStreamRepository";

export class StreamRepository implements IStreamRepository {
  private readonly collectionName = "streams";
  private readonly streamsSelectFields: (keyof StreamEntities)[] = [
    "id",
    "name",
    "password",
    "idUser",
  ];

  constructor(private dataAcess: IDataAccess) {}
  async getStreamByIdUser(idUser: string): Promise<StreamEntities[]> {
    const rawDataStreams: StreamEntities[] =
      await this.dataAcess.findMany<StreamEntities>(
        this.collectionName,
        {},
        this.streamsSelectFields
      );

    const streams: StreamEntities[] = rawDataStreams.filter(
      (stream): stream is StreamEntities => {
        return stream.idUser === idUser;
      }
    );

    if (streams.length === 0) {
      throw new Error("not stream on this user");
    }

    return streams;
  }

  async getAllStream(): Promise<StreamEntities[]> {
    const rawDataStreams: StreamEntities[] =
      await this.dataAcess.findMany<StreamEntities>(
        this.collectionName,
        {},
        this.streamsSelectFields
      );
    const streams: StreamEntities[] = rawDataStreams.map((stream) =>
      StreamEntities.createFromData(stream)
    );
    return streams;
  }

  async save(streamEntities: StreamEntities): Promise<any> {
    const insertResult = await this.dataAcess.create(
      this.collectionName,
      streamEntities
    );

    if (insertResult !== undefined) {
      return streamEntities;
    }
    return undefined;
  }

  async getStreamById(id: string): Promise<StreamEntities> {
    const rawData = await this.dataAcess.findOne<StreamEntities>(
      this.collectionName,
      { id: id },
      this.streamsSelectFields
    );

    if (!rawData) {
      throw new Error(`Stream com ID ${id} não encontrada.`);
    }

    return StreamEntities.createFromData(rawData);
  }

  async deleteStreamById(id: string): Promise<any> {
    return await this.dataAcess.remove(this.collectionName, { id: id });
  }

  async updateStreamById(
    streamToUpdate: StreamEntities
  ): Promise<StreamEntities | undefined> {
    let existingStream: StreamEntities | undefined;
    try {
      existingStream = await this.getStreamById(streamToUpdate.id);
    } catch (error) {
      existingStream = undefined;
    }

    if (existingStream) {
      existingStream.updateFields({
        name: streamToUpdate.name,
        password: streamToUpdate.password,
      });

      const affectedRows = await this.dataAcess.update(
        this.collectionName,
        { id: existingStream.id },
        existingStream
      );

      if (affectedRows > 0) {
        return existingStream;
      }

      return undefined;
    } else {
      return undefined;
    }
  }
}
