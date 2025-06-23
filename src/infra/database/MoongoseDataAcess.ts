import mongoose from "mongoose";
import { IDatabaseHandler } from "../../domain/repository/IDatabaseHandler";
import { IDataAccess } from "../../domain/repository/IDataAccess";

export class MongooseDataAccess implements IDataAccess {
  private dbConnection: mongoose.Mongoose | null = null;
  private readonly databaseHandler: IDatabaseHandler<mongoose.Mongoose>;

  constructor(databaseHandler: IDatabaseHandler<mongoose.Mongoose>) {
    this.databaseHandler = databaseHandler;
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      this.dbConnection = await this.databaseHandler.getConnection();
      console.log("MongooseDataAccess: Conexão com DB inicializada.");
    } catch (error) {
      console.error(
        "MongooseDataAccess: Erro ao inicializar conexão com DB:",
        error
      );
    }
  }

  private async ensureConnected(): Promise<mongoose.Mongoose> {
    if (!this.dbConnection || this.dbConnection.connection.readyState !== 1) {
      console.log(
        "MongooseDataAccess: Conexão não ativa, tentando reconectar..."
      );
      await this.initializeConnection();
      if (!this.dbConnection || this.dbConnection.connection.readyState !== 1) {
        throw new Error(
          "MongooseDataAccess: Conexão com o banco de dados não estabelecida após tentativas."
        );
      }
    }
    return this.dbConnection;
  }

  /**
   * Converte um objeto de consulta para o formato do MongoDB.
   * Se a sua entidade usa 'id' como UUID (string), o MongoDB deve armazená-lo como '_id' string.
   * REMOVEMOS A CONVERSÃO PARA ObjectId AQUI.
   * @param query Objeto de consulta.
   * @returns Objeto de consulta formatado para MongoDB.
   */
  private formatQuery<T>(query: Partial<T>): Record<string, any> {
    const formattedQuery: Record<string, any> = {
      ...(query as Record<string, any>),
    };
    if ("id" in formattedQuery && formattedQuery.id !== undefined) {
      // Se 'id' é um UUID string, o MongoDB o armazenará como _id string.
      // Apenas renomeamos a chave de 'id' para '_id'.
      formattedQuery._id = formattedQuery.id;
      delete formattedQuery.id;
    }
    return formattedQuery;
  }

  /**
   * Converte o _id do MongoDB para 'id' no objeto de resultado, se aplicável.
   * @param doc O documento retornado do MongoDB.
   * @returns O documento com 'id' em vez de '_id'.
   */
  private formatResult<T>(doc: any): T {
    if (doc && doc._id) {
      doc.id = doc._id.toString(); // Garante que é uma string
      delete doc._id;
    }
    return doc as T;
  }

  /**
   * Mapeia os campos de seleção para o formato de projeção do MongoDB.
   * @param selectFields Campos a serem selecionados.
   * @returns Objeto de projeção do MongoDB.
   */
  private getProjection<T>(
    selectFields?: (keyof T)[]
  ): Record<string, 0 | 1> | undefined {
    if (!selectFields || selectFields.length === 0) {
      return undefined;
    }
    const projection: Record<string, 0 | 1> = {};
    selectFields.forEach((field) => {
      if (field === "id") {
        projection["_id"] = 1; // Mapeia 'id' para '_id' do MongoDB
      } else {
        projection[field as string] = 1;
      }
    });
    return Object.keys(projection).length > 0 ? projection : undefined;
  }

  async findMany<T>(
    collectionName: string,
    query?: Partial<T>,
    selectFields?: (keyof T)[]
  ): Promise<T[]> {
    await this.ensureConnected();
    const formattedQuery = query ? this.formatQuery(query) : {};
    const projection = this.getProjection(selectFields);

    try {
      const cursor = this.dbConnection!.connection.collection(
        collectionName
      ).find(formattedQuery, { projection });
      const rawResults = await cursor.toArray();
      return rawResults.map((doc) => this.formatResult(doc));
    } catch (error) {
      console.error(
        `MongooseDataAccess: Erro ao buscar múltiplos documentos na coleção ${collectionName}:`,
        error
      );
      return [];
    }
  }

  async findOne<T>(
    collectionName: string,
    query: Partial<T>,
    selectFields?: (keyof T)[]
  ): Promise<T | undefined> {
    await this.ensureConnected();
    const formattedQuery = this.formatQuery(query);
    const projection = this.getProjection(selectFields);

    try {
      const rawResult = await this.dbConnection!.connection.collection(
        collectionName
      ).findOne(formattedQuery, { projection });
      return rawResult ? this.formatResult(rawResult) : undefined;
    } catch (error) {
      console.error(
        `MongooseDataAccess: Erro ao buscar um documento na coleção ${collectionName}:`,
        error
      );
      return undefined;
    }
  }

  async create<T>(
    collectionName: string,
    data: Partial<T>
  ): Promise<string | number | undefined> {
    await this.ensureConnected();
    const dataToInsert = { ...(data as Record<string, any>) };
    // Se o 'id' já foi gerado na sua entidade (ex: UUID), ele deve ser o '_id' do MongoDB
    if ("id" in dataToInsert) {
      dataToInsert._id = dataToInsert.id; // Mapeia id da entidade para _id do MongoDB
      delete dataToInsert.id; // Remove a propriedade 'id' original
    } else {
      // Se 'id' não existe na entidade, o MongoDB gerará um ObjectId padrão
      // Não adicione lógica de geração de UUID aqui, pois isso é responsabilidade do domínio.
    }

    try {
      const result = await this.dbConnection!.connection.collection(
        collectionName
      ).insertOne(dataToInsert);
      return result.insertedId ? result.insertedId.toString() : undefined;
    } catch (error) {
      console.error(
        `MongooseDataAccess: Erro ao criar documento na coleção ${collectionName}:`,
        error
      );
      return undefined;
    }
  }

  async update<T>(
    collectionName: string,
    query: Partial<T>,
    data: Partial<T>
  ): Promise<number> {
    await this.ensureConnected();
    const formattedQuery = this.formatQuery(query);
    const updateData = { ...(data as Record<string, any>) };
    // Remove o campo 'id' e '_id' dos dados a serem atualizados
    if ("id" in updateData) delete updateData.id;
    if ("_id" in updateData) delete updateData._id;

    try {
      const result = await this.dbConnection!.connection.collection(
        collectionName
      ).updateMany(formattedQuery, { $set: updateData });
      return result.modifiedCount;
    } catch (error) {
      console.error(
        `MongooseDataAccess: Erro ao atualizar documentos na coleção ${collectionName}:`,
        error
      );
      return 0;
    }
  }

  async remove(collectionName: string, query: Partial<any>): Promise<number> {
    await this.ensureConnected();
    const formattedQuery = this.formatQuery(query);

    try {
      const result = await this.dbConnection!.connection.collection(
        collectionName
      ).deleteMany(formattedQuery);
      return result.deletedCount;
    } catch (error) {
      console.error(
        `MongooseDataAccess: Erro ao remover documentos na coleção ${collectionName}:`,
        error
      );
      return 0;
    }
  }
}
