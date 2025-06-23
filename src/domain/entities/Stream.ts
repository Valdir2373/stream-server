import { ICreateId } from "../services/ICreateId";

export class StreamEntities {
  constructor(
    public name: string,
    public password: string,
    public id: string, // Este é o ID da Stream
    public idUser: string // Novo: ID do usuário associado à Stream
  ) {}

  public static generateStream(
    name: string,
    password: string,
    idUser: string, // Adicionado idUser como parâmetro
    create: ICreateId
  ): StreamEntities {
    const id = create.generateID(); // Gera o ID da Stream
    const newStreamEntities = new StreamEntities(name, password, id, idUser);
    return newStreamEntities;
  }

  public static createFromData(data: {
    name: string;
    password: string;
    id: string;
    idUser: string; // Adicionado idUser
  }): StreamEntities {
    return new StreamEntities(data.name, data.password, data.id, data.idUser);
  }

  public updateFields(data: {
    name?: string;
    password?: string;
    // idUser geralmente não é atualizável após a criação,
    // mas pode ser adicionado aqui se necessário.
    // idUser?: string;
  }): void {
    if (data.name !== undefined) {
      this.name = data.name;
    }
    if (data.password !== undefined) {
      this.password = data.password;
    }
  }
}
