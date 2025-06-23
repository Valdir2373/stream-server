import { PoolConnection } from "mysql2/promise";
import { IDatabaseHandler } from "../../domain/repository/IDatabaseHandler";

export class MySqlDatabaseHandler implements IDatabaseHandler<PoolConnection> {
  constructor(private readonly dbHandler: IDatabaseHandler<PoolConnection>) {}

  async getConnection(): Promise<PoolConnection> {
    return this.dbHandler.getConnection();
  }
  async closePool(): Promise<void> {
    await this.dbHandler.closePool();
  }
}
