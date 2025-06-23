import { ConfigEnv } from "./Config.env";

export class ConfigDB {
  configEnv: ConfigEnv;
  constructor() {
    this.configEnv = new ConfigEnv();
  }
  public getConfigDB(): string {
    const url = this.configEnv.ambientVariableDatabase();
    if (!url) throw new Error("URL não encontrada");
    return url;
  }
}
