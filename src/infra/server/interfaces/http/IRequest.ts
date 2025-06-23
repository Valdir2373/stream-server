export interface IRequest {
  body: any;
  params: any;
  query: any;
  headers: any;
  method: string;
  path: string;
  userPayload?: any;
  cookies?: { [key: string]: string };
}
