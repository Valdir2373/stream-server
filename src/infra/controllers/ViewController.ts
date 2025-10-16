import path from "path";
import { IRequest } from "../server/interfaces/http/IRequest";
import { IResponse } from "../server/interfaces/http/IResponse";
import { IServer } from "../server/interfaces/http/IServer";
import { Cookies } from "../../shared/utils/Cookies";
import { log } from "console";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const caminhoPadrão = path.join(__dirname, "..", "..", "view", "pages");

const pathStream = path.join(caminhoPadrão, "stream");

export class ViewController {
  constructor(
    private cookies: Cookies // private authTokenManager: IAuthTokenManager
  ) {}
  async register(req: IRequest, res: IResponse): Promise<void> {
    const logged = this.cookies.vefifyCookieAcess(req.cookies);
    log(logged);
    if (!logged)
      return res.sendArchive(path.join(caminhoPadrão, "register.html"));
    return res.sendArchive(this.pageNotFound());
  }
  async login(req: IRequest, res: IResponse): Promise<void> {
    const logged = this.cookies.vefifyCookieAcess(req.cookies);
    if (!logged) return res.sendArchive(path.join(caminhoPadrão, "login.html"));
    return res.sendArchive(this.pageNotFound());
  }
  async myProfile(req: IRequest, res: IResponse): Promise<void> {
    const logged = this.cookies.vefifyCookieAcess(req.cookies);
    if (logged)
      return res.sendArchive(path.join(caminhoPadrão, "myProfile.html"));
    return res.sendArchive(this.pageNotFound());
  }
  private pageNotFound(): string {
    return path.join(caminhoPadrão, "404.html");
  }
  async home(req: IRequest, res: IResponse): Promise<void> {
    res.sendArchive(path.join(caminhoPadrão, "index.html"));
  }
  async streamCreate(req: IRequest, res: IResponse): Promise<void> {
    res.sendArchive(path.join(pathStream, "streamCreate.html"));
  }
  async myStreams(req: IRequest, res: IResponse): Promise<void> {
    res.sendArchive(path.join(caminhoPadrão, "myStreams.html"));
  }

  async watchStream(req: IRequest, res: IResponse): Promise<void> {
    res.sendArchive(path.join(caminhoPadrão, "watchStream.html"));
  }

  async mountRouters(server: IServer) {
    server.registerRouter("get", "/register.html", this.register.bind(this));
    server.registerRouter("get", "/login.html", this.login.bind(this));
    server.registerRouter("get", "/", this.home.bind(this));
    server.registerRouter("get", "/myProfile.html", this.myProfile.bind(this));
    server.registerRouter("get", "/myStreams.html", this.myStreams.bind(this));
    server.registerRouter("get", "/watchStream", this.watchStream.bind(this));
    server.registerRouter(
      "get",
      "/streamCreate.html",
      this.streamCreate.bind(this)
    );
  }
  // private verifyTokenAcess(tokenAcess: any) {
  //   try {
  //     this.authTokenManager.verifyToken(tokenAcess);
  //   } catch (e: any) {
  //     if (e.message === "Token inválido ou malformado.") return false;
  //     console.error(e);
  //   }
  // }
}
