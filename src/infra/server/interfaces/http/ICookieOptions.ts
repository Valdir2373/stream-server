export interface ICookieOptions {
  domain?: string;
  encode?: (val: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  priority?: "low" | "medium" | "high";
  secure?: boolean;
  signed?: boolean;
  sameSite?: "strict" | "lax" | "none" | boolean;
}
