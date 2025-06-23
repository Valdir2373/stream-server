import { IRequest } from "./IRequest";
import { IResponse } from "./IResponse";

export type MiddlewareHandler = (
  req: IRequest,
  res: IResponse,
  next: () => void
) => Promise<void>;
