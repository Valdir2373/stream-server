import { ICreateId } from "../services/ICreateId";

export class UserEntities {
  constructor(
    public username: string,
    public email: string,
    public password: string,
    public id: string,
    public verification: boolean | Date,
    public adm: boolean,
    public created_at: Date,
    public updated_at: Date
  ) {}

  public static generateEntitie(
    username: string,
    email: string,
    password: string,
    createId: ICreateId
  ): UserEntities {
    const id = createId.generateID();
    const now = new Date();

    const userEntities = new UserEntities(
      username,
      email,
      password,
      id,
      now,
      false,
      now,
      now
    );
    return userEntities;
  }

  public static createFromData(data: {
    id: string;
    username: string;
    email: string;
    password?: string;
    verification: boolean | Date;
    adm: boolean;
    created_at: Date | string;
    updated_at: Date | string;
  }): UserEntities {
    const created_at =
      data.created_at instanceof Date
        ? data.created_at
        : new Date(data.created_at);
    const updated_at =
      data.updated_at instanceof Date
        ? data.updated_at
        : new Date(data.updated_at);

    return new UserEntities(
      data.username,
      data.email,
      data.password || "",
      data.id,
      data.verification,
      data.adm,
      created_at,
      updated_at
    );
  }

  public updateFields(data: Partial<UserEntities>): void {
    if (data.username !== undefined) {
      this.username = data.username;
    }
    if (data.email !== undefined) {
      this.email = data.email;
    }
    if (data.password !== undefined) {
      this.password = data.password;
    }
    if (data.verification !== undefined) {
      this.verification = data.verification;
    }
    this.updated_at = new Date();
  }
}
