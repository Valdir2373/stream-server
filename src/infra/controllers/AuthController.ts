import { UserInputDTO } from "../../application/users/DTO/UserInput";
import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
import { UsersSchemas } from "../../schemas/UsersSchemas";
import { ValidationError } from "../../shared/error/ValidationError";
import { IDTOBuilderAndValidator } from "../../shared/validator/IFieldsValidator";
import { IEmailService } from "../interfaces/IEmailService";
import { IUserLogin } from "../interfaces/IUserLogin";
import { IAuthTokenManager } from "../security/tokens/IAuthTokenManager";
import { IRequest } from "../server/interfaces/http/IRequest";
import { IResponse } from "../server/interfaces/http/IResponse";
import { IServer } from "../server/interfaces/http/IServer";
import { UsersService } from "../service/UsersService";

export class AuthController {
  private schemasUserLogin: IDTOBuilderAndValidator<IUserLogin>;
  private schemasUserDto: IDTOBuilderAndValidator<UserInputDTO>;

  constructor(
    private server: IServer,
    private token: IAuthTokenManager,
    private usersService: UsersService,
    private emailService: IEmailService,
    private usersSchemas: UsersSchemas
  ) {
    this.schemasUserDto = this.usersSchemas.schemasUserDto;
    this.schemasUserLogin = this.usersSchemas.schemasUserLogin;

    this.mountRouters(this.server);
  }
  private mountRouters(server: IServer) {
    server.registerRouter("post", "/users/login", this.login.bind(this));

    server.registerRouter("get", "/refreshToken", this.refreshToken.bind(this));
    server.registerRouter("get", "/verifyUser", this.verifyUser.bind(this));
    server.registerRouter(
      "get",
      "/verifyEmail/:token",
      this.verifyEmail.bind(this)
    );
    server.registerRouter(
      "get",
      "/resend-verification/:email",
      this.resendVerification.bind(this)
    );
  }

  private async verifyEmail(req: IRequest, res: IResponse) {
    const { token } = req.params;
    const response = await this.token.verifyTokenTimerSet(token);
    if (!response.status)
      return res.status(401).json({ message: "unauthorized" });
    const { email } = response.jwt;
    await this.usersService.authenticateUser(email);
    const userOutput = await this.usersService.getByEmailUser(email);
    if (!userOutput) return;
    this.cookieDefinerUser(res, userOutput);
    return res.redirect("https://stream-server-vava.onrender.com:443/");
  }

  private async resendVerification(
    req: IRequest,
    res: IResponse
  ): Promise<any> {
    try {
      const { email } = req.params;
      const verified = await this.usersService.verifyUserByEmail(email);
      if (verified)
        return res.status(400).json({ message: "email already verified" });
      const userOutput = await this.usersService.getByEmailUser(email);
      if (!userOutput) return;
      await this.emailService.sendEmailVerificationUser(userOutput);
      return res.status(200).json({ message: "email sended" });
    } catch (e: any) {
      if (e.message === "user not found")
        return res.json({ message: "email sended" });
      console.error(e);
      return res.status(500).json({ message: "internal server error" });
    }
  }

  public async refreshToken(req: IRequest, res: IResponse) {
    try {
      const token: any = this.verifyCookieToRefresh(req);

      if (!token.status)
        return res.status(401).json({ message: "unauthorized" });

      const user = token.jwt;

      const userOutput: UserOutputDTO = {
        username: user.username,
        email: user.email,
        id: user.id,
      };

      res.cookie("tokenAcess", this.token.generateToken(userOutput), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 16 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });
      res.status(200).json({ message: "token enviado" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "internal server error" });
    }
  }

  public async verifyUser(req: IRequest, res: IResponse) {
    const cookie: any = this.verifyCookieToAcess(req);

    cookie ? res.send(cookie) : res.send(false);
  }

  verifyCookieToRefresh(req: IRequest) {
    const cookie = req.cookies;
    if (!cookie) return;
    const token = cookie.refreshToken;
    const tokenAcessNotPermitted = cookie.tokenAcess;
    try {
      if (!tokenAcessNotPermitted) return this.token.verifyRefreshToken(token);
      return true;
    } catch (error: any) {
      if (error.message === "Token inválido ou malformado") return false;
    }
  }

  verifyCookieToAcess(req: IRequest): boolean | any {
    const cookie = req.cookies;
    if (!cookie) return false;
    const tokenAcess = this.token.verifyToken(cookie.tokenAcess);

    return tokenAcess.status ? tokenAcess.jwt : false;
  }

  private async login(req: IRequest, res: IResponse): Promise<void> {
    try {
      const inputData = req.body;

      if (!this.verifyInputUserLogin(inputData, res)) return;

      const userOutput = await this.usersService.loginUserService(inputData);

      console.log(userOutput);

      if (typeof userOutput === "string")
        return res.status(401).json(userOutput);

      this.cookieDefinerUser(res, userOutput);
      return res.status(200).json(userOutput);
    } catch (e: any) {
      if (e.message === "Erro de validação do DTO") {
        console.log(e.message + " tratado");
      }
    }
  }

  private verifyInputUserLogin(user: IUserLogin, res: IResponse): boolean {
    try {
      this.schemasUserLogin.validate(user);
      return true;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(401).json({ error: error.details });
        throw new Error(error.message);
      } else {
        console.error(
          "Um erro inesperado ocorreu na validação:",
          error.message
        );
        return false;
      }
    }
  }

  cookieDefinerUser(res: IResponse, userOutput: UserOutputDTO) {
    res.cookie("refreshToken", this.token.generateRefreshToken(userOutput), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 12 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });
    res.cookie("tokenAcess", this.token.generateToken(userOutput), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 16 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });
  }
}
