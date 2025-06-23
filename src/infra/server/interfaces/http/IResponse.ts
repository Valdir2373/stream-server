import { ICookieOptions } from "./ICookieOptions";

export interface IResponse {
  status: (code: number) => IResponse;
  json: (data: any) => void;
  send: (data: any) => void;
  sendArchive: (data: any) => void;
  setHeader: (name: string, value: string) => IResponse;
  cookie: (name: string, value: string, options?: ICookieOptions) => IResponse;
  clearCookie: (name: string, options?: ICookieOptions) => IResponse;
  redirect: (url: string) => void;
}
