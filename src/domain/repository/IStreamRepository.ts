import { StreamEntities } from "../entities/Stream";

export interface IStreamRepository {
  getAllStream(): Promise<StreamEntities[]>;
  save(streamEntities: StreamEntities): Promise<any>;
  getStreamById(id: string): Promise<StreamEntities>;
  deleteStreamById(id: string): Promise<any>;
  getStreamByIdUser(idUser: string): Promise<StreamEntities[]>;
  updateStreamById(streamEntities: StreamEntities): Promise<any>;
}
