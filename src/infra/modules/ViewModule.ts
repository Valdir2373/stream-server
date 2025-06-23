import { Cookies } from "../../shared/utils/Cookies";
import { ViewController } from "../controllers/ViewController";
import { JsonwebtokenAuthTokenManager } from "../security/JwtAuthService";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IServer } from "../server/interfaces/http/IServer";

export class ViewModule {
  private viewController: ViewController;
  private cookies: Cookies;
  private authToken: IAuthTokenManager;
  constructor(private server: IServer) {
    this.authToken = new JsonwebtokenAuthTokenManager();
    this.cookies = new Cookies(this.authToken);
    this.viewController = new ViewController(this.cookies);
    this.viewController.mountRouters(this.server);
  }
}
