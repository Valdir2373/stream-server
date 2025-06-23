import { IAuthTokenManager } from "../../infra/security/tokens/IAuthTokenManager";
import {
  verifyTokenAcess,
  verifyTokenRefresh,
} from "../../infra/security/tokens/verifyToken";

export class Cookies {
  constructor(private AuthToken: IAuthTokenManager) {}
  public verifyCookieToRefresh(cookies: any) {
    const cookie = cookies;
    if (!cookie) return;
    const token = cookie.refreshToken;
    if (!token) return;
    const tokenAcessNotPermitted = cookie.tokenAcess;
    if (tokenAcessNotPermitted) return this.AuthToken.verifyRefreshToken(token);
  }
  public vefifyCookieAcess(cookie: any): boolean {
    if (!cookie) return false;
    const token = this.AuthToken.verifyToken(cookie.tokenAcess);

    if (token.status) return token.jwt;
    return false;
  }
}
