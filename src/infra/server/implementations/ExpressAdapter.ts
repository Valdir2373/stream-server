import express, {
  Express,
  Request,
  Response,
  NextFunction,
  CookieOptions as ExpressCookieOptions,
} from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import path from "path";
import { MiddlewareHandler } from "../interfaces/http/IMiddlewareHandler";
import { IRequest } from "../interfaces/http/IRequest";
import { IResponse } from "../interfaces/http/IResponse";
import { IServer } from "../interfaces/http/IServer";
import { ICookieOptions } from "../interfaces/http/ICookieOptions";

import { fileURLToPath } from "url";
import { dirname } from "path";
import { Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const caminhoPadrão = path.join(__dirname, "..", "..", "..", "view", "pages");

export class ExpressAdapter implements IServer {
  private app: Express;
  private httpServerInstance: Server | null = null;

  constructor() {
    this.app = express();
    this.app.use(cookieparser());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use("/js", express.static(path.join(caminhoPadrão, "js")));
    this.app.use("/css", express.static(path.join(caminhoPadrão, "css")));
    this.app.use(express.static("/css"));
    console.log("ExpressAdapter instanciado");

    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        console.error("Erro na cadeia de handlers:", err);
        if (res.headersSent) {
          return next(err);
        }
        res.status(err.status || 500).json({
          message: err.message || "Erro interno do servidor.",
          error: process.env.NODE_ENV === "development" ? err : {},
        });
      }
    );
  }

  getHttpServer(): Server {
    if (!this.httpServerInstance) {
      throw new Error(
        "HTTP Server não foi iniciado ainda. Chame listen() primeiro."
      );
    }
    return this.httpServerInstance;
  }

  registerRouter(
    methodHTTP: string,
    path: string,
    ...handlers: MiddlewareHandler[]
  ): void {
    const expressHandlers = handlers.map((handler) => {
      return async (
        expressReq: Request,
        expressRes: Response,
        expressNext: NextFunction
      ) => {
        const ireq: IRequest = {
          body: expressReq.body,
          params: expressReq.params,
          query: expressReq.query,
          headers: expressReq.headers,
          method: expressReq.method,
          path: expressReq.path,
          userPayload: (expressReq as any).userPayload,
          cookies: expressReq.cookies,
        };

        const ires: IResponse = {
          status: (code: number) => {
            expressRes.status(code);
            return ires;
          },
          json: (data: any) => expressRes.json(data),
          send: (data: any) => expressRes.send(data),
          sendArchive: (data: any) => expressRes.sendFile(data),
          setHeader: (name: string, value: string) => {
            expressRes.setHeader(name, value);
            return ires;
          },

          cookie: (name: string, value: string, options?: ICookieOptions) => {
            const expressOptions: ExpressCookieOptions = { ...options };
            expressRes.cookie(name, value, expressOptions);
            return ires;
          },

          clearCookie: (name: string, options?: ICookieOptions) => {
            const expressOptions: ExpressCookieOptions = { ...options };
            expressRes.clearCookie(name, expressOptions);
            return ires;
          },
          redirect: (url: string) => expressRes.redirect(url),
        };

        const next = (err?: any) => {
          if (err) {
            return expressNext(err);
          }
          expressNext();
        };

        try {
          await handler(ireq, ires, next);
        } catch (error) {
          console.error("Erro capturado no handler do usuário:", error);
          if (!expressRes.headersSent) {
            ires.status((error as any).status || 500).json({
              message:
                (error as any).message ||
                "Erro interno do servidor durante a execução do handler.",
            });
          } else {
            console.error("Erro capturado após headers enviados:", error);
          }
        }
      };
    });

    this.app[methodHTTP as keyof express.Application](path, ...expressHandlers);
    console.log(` Rota registrada: ${methodHTTP.toUpperCase()} ${path}`);
  }

  listen(port: number, callback?: () => void): Server {
    this.httpServerInstance = this.app.listen(port, () => {
      console.log(`Servidor rodando na porta :${port}`);
      if (callback) {
        callback();
      }
    });
    return this.httpServerInstance;
  }
}
