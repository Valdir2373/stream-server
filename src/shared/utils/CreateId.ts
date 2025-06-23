import { ICreateId } from "../../domain/services/ICreateId";
import { v4 as id } from "uuid";

export class CreateIdImpl implements ICreateId {
  generateID(): string {
    return id();
  }
}
