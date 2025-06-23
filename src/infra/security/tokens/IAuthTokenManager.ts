export interface IAuthTokenManager {
  generateToken(payload: object, options?: TokenGenerationOptions): string;

  generateRefreshToken(
    payload: object,
    options?: TokenGenerationOptions
  ): string;

  generateTokenTimerSet(
    payload: object,
    expiresIn: string | number,
    options?: TokenGenerationOptions
  ): string;

  verifyTokenTimerSet<T extends object>(token: string): any;

  verifyToken<T extends object>(token: string): any;

  verifyRefreshToken<T extends object>(token: string): any;

  decodeToken<T extends object>(token: string): T | null;

  revokeToken?(token: string): Promise<void>;
}

export interface TokenGenerationOptions {
  expiresIn?: string | number;
  audience?: string | string[];
  issuer?: string;
  subject?: string;
  jwtid?: string;
  notBefore?: string | number;
}

export interface TokenVerificationOptions {
  audience?: string | string[];
  issuer?: string;
  subject?: string;
  ignoreExpiration?: boolean;
  ignoreNotBefore?: boolean;
  maxAge?: string;
  clockTolerance?: number;
}
