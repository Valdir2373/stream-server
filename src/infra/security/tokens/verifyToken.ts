import { JsonwebtokenAuthTokenManager } from "../JwtAuthService";

const jwtAuthService = new JsonwebtokenAuthTokenManager();

const verifyTokenAcess = (token: string) => {
  return jwtAuthService.verifyToken(token);
};
const verifyTokenRefresh = (token: string): any => {
  return jwtAuthService.verifyRefreshToken(token);
};

export { verifyTokenAcess, verifyTokenRefresh };
