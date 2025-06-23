import { IRequest } from "../server/interfaces/http/IRequest";
import { IResponse } from "../server/interfaces/http/IResponse";
import { IServer } from "../server/interfaces/http/IServer";
import { AuthController } from "./AuthController";
import { StreamService } from "../service/StreamService";
import { StreamInputDTO } from "../../application/stream/DTO/streamInput";
import { StreamOutputDTO } from "../../application/stream/DTO/streamOutput";
import { existsSync, readFileSync, promises as fsPromises } from "fs";

export class StreamController {
  constructor(
    private authController: AuthController,
    private streamService: StreamService
  ) {}
  private async createStream(req: IRequest, res: IResponse): Promise<any> {
    const token = this.authController.verifyCookieToAcess(req);
    if (!token) {
      console.warn(
        "[StreamController]: Tentativa de acesso não autorizado - cookie inválido."
      );
      return res.status(401).json({ message: "error cookie invalid" });
    }

    const streamInputDto: StreamInputDTO = this.createStreamInputDto(req);
    console.log(
      "[StreamController]: DTO de Stream recebido:",
      streamInputDto.name
    );

    try {
      const compileResult = await this.streamService.saveStream(
        streamInputDto,
        token.id
      );
      console.log(
        "[StreamController]: Resultado da compilação Go:",
        compileResult
      );

      console.log(compileResult);

      if (compileResult.status && compileResult.path) {
        const filePath = compileResult.path;

        if (existsSync(filePath)) {
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="capture_client.exe"`
          );

          const fileContent = readFileSync(filePath);
          res.status(200).send(fileContent);
          console.log(
            `[StreamController]: Executável Go '${filePath}' enviado para o frontend.`
          );

          try {
            await fsPromises.unlink(filePath);
            console.log(
              `[StreamController]: Executável temporário '${filePath}' removido com sucesso.`
            );
          } catch (cleanupErr: any) {
            console.error(
              `[StreamController]: Erro ao remover executável temporário '${filePath}':`,
              cleanupErr
            );
          }
        } else {
          console.error(
            `[StreamController]: Erro: Arquivo executável Go não encontrado em ${filePath}`
          );
          return res
            .status(500)
            .json({ message: "Erro ao gerar ou encontrar o executável Go." });
        }
      } else {
        console.error(
          "[StreamController]: Falha na compilação do executável Go."
        );
        return res
          .status(500)
          .json({ message: "Falha na compilação do executável Go." });
      }
    } catch (error: any) {
      console.error(
        "[StreamController]: Erro ao processar criação de stream/compilação Go:",
        error
      );
      return res
        .status(500)
        .json({ message: `Erro interno do servidor: ${error.message}` });
    }
  }

  private async getStreamIdByName(req: IRequest, res: IResponse): Promise<any> {
    const nameStream = req.params.nameStream;
    const idUser = req.body.idUser;

    const streamId = await this.streamService.getStreamIdByName(
      nameStream,
      idUser
    );

    if (!streamId) return res.status(404).json({ message: "Stream not found" });
    return res.json({ idStream: streamId });
  }

  private async getAllStreamByIdUser(
    req: IRequest,
    res: IResponse
  ): Promise<any> {
    const token = this.authController.verifyCookieToAcess(req);
    if (!token)
      return res.status(401).json({ message: "error cookie invalid" });

    const allStreams: StreamOutputDTO[] =
      await this.streamService.getAllStreams(token.id);
    return res.json(allStreams);
  }

  private createStreamInputDto(req: IRequest): StreamInputDTO {
    // Agora, usamos 'name' e 'password' para corresponder ao que o frontend envia
    const name = req.body.name;
    const password = req.body.password;

    console.log(
      "[StreamController]: Conteúdo de req.body no createStreamInputDto:",
      req.body
    );
    console.log(
      `[StreamController]: Extraído - Nome: ${name}, Senha: ${
        password ? "*****" : "nenhuma"
      }`
    );

    return {
      name,
      password,
    };
  }

  private async deleteStreamById(req: IRequest, res: IResponse) {
    const message = await this.streamService.deteStreamByIdFromRepository(
      req.params.idStream
    );
    res.json(message);
  }

  public mountRouter(server: IServer) {
    server.registerRouter(
      "post",
      "/getStreamIdByName/:nameStream",
      this.getStreamIdByName.bind(this)
    );
    server.registerRouter(
      "post",
      "/createStream",
      this.createStream.bind(this)
    );
    server.registerRouter(
      "get",
      "/getAllStreams",
      this.getAllStreamByIdUser.bind(this)
    );
    server.registerRouter(
      "delete",
      "/deleteStream",
      this.deleteStreamById.bind(this)
    );
  }
}
