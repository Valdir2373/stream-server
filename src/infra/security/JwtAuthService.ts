import {
  IAuthTokenManager,
  TokenGenerationOptions,
} from "./tokens/IAuthTokenManager";
import jwt, { SignOptions } from "jsonwebtoken";
import { ConfigJwt } from "./ConfigJwt";

export class JsonwebtokenAuthTokenManager implements IAuthTokenManager {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtTimeSetSecret: string;
  private readonly accessTokenExpiresIn: string | number;
  private readonly refreshTokenExpiresIn: string | number;

  constructor(
    accessTokenExpiresIn: string | number = "15m",
    refreshTokenExpiresIn: string | number = "7d"
  ) {
    const configJwt = new ConfigJwt();
    const { jwtSecret, jwtRefreshSecret, jwtTimeSetSecret } =
      configJwt.ambientVariablesJWTConfig();

    if (!jwtSecret || !jwtRefreshSecret || !jwtTimeSetSecret) {
      throw new Error(
        "JWT secrets must be provided. Check your environment variables."
      );
    }

    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
    this.jwtTimeSetSecret = jwtTimeSetSecret;
    this.accessTokenExpiresIn = accessTokenExpiresIn;
    this.refreshTokenExpiresIn = refreshTokenExpiresIn;
  }

  private buildSignOptions(
    baseExpiresIn: string | number,
    options?: TokenGenerationOptions
  ): jwt.SignOptions {
    const signOptions: jwt.SignOptions = {
      expiresIn: (options?.expiresIn ??
        baseExpiresIn) as SignOptions["expiresIn"],
    };

    if (typeof options?.issuer === "string") {
      signOptions.issuer = options.issuer;
    }

    if (typeof options?.subject === "string") {
      signOptions.subject = options.subject;
    }

    if (typeof options?.jwtid === "string") {
      signOptions.jwtid = options.jwtid;
    }

    if (
      typeof options?.notBefore === "string" ||
      typeof options?.notBefore === "number"
    ) {
      signOptions.notBefore = options.notBefore as SignOptions["notBefore"];
    }

    if (
      typeof options?.audience === "string" ||
      Array.isArray(options?.audience)
    ) {
      signOptions.audience = options.audience;
    }

    return signOptions;
  }

  public generateToken(
    payload: object,
    options?: TokenGenerationOptions
  ): string {
    const signOptions = this.buildSignOptions(
      this.accessTokenExpiresIn,
      options
    );
    return jwt.sign(payload, this.jwtSecret, signOptions);
  }

  public generateRefreshToken(
    payload: object,
    options?: TokenGenerationOptions
  ): string {
    const signOptions = this.buildSignOptions(
      this.refreshTokenExpiresIn,
      options
    );
    return jwt.sign(payload, this.jwtRefreshSecret, signOptions);
  }

  public generateTokenTimerSet(
    payload: object,
    expiresIn: string | number,
    options?: TokenGenerationOptions
  ): string {
    const signOptions = this.buildSignOptions(expiresIn, options);
    return jwt.sign(payload, this.jwtTimeSetSecret, signOptions);
  }

  verifyTokenTimerSet(token: string) {
    return this.verifyAndHandleErrors(token, this.jwtTimeSetSecret);
  }

  private verifyAndHandleErrors<T extends object>(
    token: string,
    secret: string
  ): T {
    try {
      return { jwt: jwt.verify(token, secret) as T, status: true } as T;
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        return { message: "Token expirado.", status: false } as T;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { message: "Token inválido ou malformado.", status: false } as T;
      }
      throw error;
    }
  }

  public verifyToken<T extends object>(token: string): T {
    return this.verifyAndHandleErrors(token, this.jwtSecret);
  }

  public verifyRefreshToken<T extends object>(token: string): T {
    return this.verifyAndHandleErrors(token, this.jwtRefreshSecret);
  }

  public decodeToken<T extends object>(token: string): T | null {
    return jwt.decode(token) as T | null;
  }

  public async revokeToken(token: string): Promise<void> {
    console.warn(`Implementação de revogação de token para: ${token}`);
    return Promise.resolve();
  }
}
