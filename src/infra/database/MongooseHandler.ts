import mongoose from "mongoose";
import { IDatabaseHandler } from "../../domain/repository/IDatabaseHandler"; // Ajuste o caminho se necessário

export class MongooseHandler implements IDatabaseHandler<mongoose.Mongoose> {
  private connectionInstance: mongoose.Mongoose | null = null;
  private readonly connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async getConnection(): Promise<mongoose.Mongoose> {
    if (
      this.connectionInstance &&
      this.connectionInstance.connection.readyState === 1
    ) {
      console.log("Reutilizando conexão existente com MongoDB.");
      return this.connectionInstance;
    }

    try {
      console.log("Conectando ao MongoDB...");
      this.connectionInstance = await mongoose.connect(this.connectionString);
      console.log("Conectado ao MongoDB!");
      return this.connectionInstance;
    } catch (error) {
      console.error("Erro ao conectar ao MongoDB:", error);
      throw new Error("Falha ao conectar ao banco de dados.");
    }
  }

  async closePool(): Promise<void> {
    if (
      this.connectionInstance &&
      this.connectionInstance.connection.readyState === 1
    ) {
      try {
        await this.connectionInstance.disconnect();
        console.log("Conexão com MongoDB fechada.");
        this.connectionInstance = null; // Limpa a instância após desconectar
      } catch (error) {
        console.error("Erro ao fechar a conexão com MongoDB:", error);
        throw new Error("Falha ao fechar a conexão com o banco de dados.");
      }
    } else {
      console.log("Nenhuma conexão ativa para fechar com MongoDB.");
    }
  }
}
