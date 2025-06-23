import { ConfigEnv } from "./Config.env";

export class ConfigEmail {
  configEnv: ConfigEnv;
  constructor() {
    this.configEnv = new ConfigEnv();
  }

  get getTransporter() {
    return {
      host: this.configEnv.get("EMAIL_HOST"),
      port: Number(this.configEnv.get("EMAIL_PORT")),
      secure: this.configEnv.get("EMAIL_SECURE") === "true",
      auth: {
        user: this.configEnv.get("EMAIL_USER"),
        pass: this.configEnv.get("EMAIL_PASS"),
      },
    };
  }
}
