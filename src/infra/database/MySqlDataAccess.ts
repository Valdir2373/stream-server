import {
  Connection,
  FieldPacket,
  RowDataPacket,
  OkPacket,
  PoolConnection,
} from "mysql2/promise";
import { IDatabaseHandler } from "../../domain/repository/IDatabaseHandler";
import { IDataAccess } from "../../domain/repository/IDataAccess";

export class MySqlDataAccess implements IDataAccess {
  constructor(
    private readonly databaseHandler: IDatabaseHandler<PoolConnection>
  ) {}
  async findMany<T>(
    collectionName: string,
    query?: Partial<T>,
    selectFields?: (keyof T)[]
  ): Promise<T[]> {
    let connection: PoolConnection | null = null;
    try {
      connection = await this.databaseHandler.getConnection();
      const fields =
        selectFields && selectFields.length > 0
          ? selectFields
              .map((field) =>
                field
                  .toString()
                  .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
              )
              .join(", ")
          : "*";
      let sql = `SELECT ${fields} FROM ${collectionName}`;
      const params: any[] = [];
      if (query && Object.keys(query).length > 0) {
        const whereClause = Object.keys(query)
          .map(
            (key) =>
              `${key.replace(
                /[A-Z]/g,
                (match) => `_${match.toLowerCase()}`
              )} = ?`
          )
          .join(" AND ");
        sql += ` WHERE ${whereClause}`;
        params.push(...Object.values(this.mapEntityToRowData(query)));
      }
      const [rows]: [RowDataPacket[], FieldPacket[]] = await connection.query(
        sql,
        params
      );

      return (rows as RowDataPacket[]).map((row) =>
        this.mapRowToEntity<T>(row)
      );
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  private mapRowToEntity<T>(row: RowDataPacket): T {
    const entity: any = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const camelCaseKey = key.replace(/_([a-z])/g, (g) =>
          g[1].toUpperCase()
        );
        entity[camelCaseKey] = row[key];
      }
    }
    return entity as T;
  }

  private mapEntityToRowData<T>(data: Partial<T>): Record<string, any> {
    const rowData: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const snakeCaseKey = key.replace(
          /[A-Z]/g,
          (match) => `_${match.toLowerCase()}`
        );
        rowData[snakeCaseKey] = (data as any)[key];
      }
    }
    return rowData;
  }

  async findOne<T>(
    collectionName: string,
    query: Partial<T>,
    selectFields?: (keyof T)[]
  ): Promise<T | undefined> {
    let connection: PoolConnection | null = null;
    try {
      connection = await this.databaseHandler.getConnection();
      const fields =
        selectFields && selectFields.length > 0
          ? selectFields
              .map((field) =>
                field
                  .toString()
                  .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
              )
              .join(", ")
          : "*";
      const whereData = this.mapEntityToRowData(query);
      const whereClause = Object.keys(whereData)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const params = Object.values(whereData);
      const sql = `SELECT ${fields} FROM ${collectionName} WHERE ${whereClause} LIMIT 1`;
      const [rows]: [RowDataPacket[], FieldPacket[]] = await connection.query(
        sql,
        params
      );

      return rows.length > 0 ? this.mapRowToEntity<T>(rows[0]) : undefined;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async create<T>(
    collectionName: string,
    data: Partial<T>
  ): Promise<string | number | undefined> {
    let connection: PoolConnection | null = null;
    try {
      connection = await this.databaseHandler.getConnection();
      const rowData = this.mapEntityToRowData(data);
      const columns = Object.keys(rowData).join(", ");
      const placeholders = Object.keys(rowData)
        .map(() => "?")
        .join(", ");
      const values = Object.values(rowData);
      const sql = `INSERT INTO ${collectionName} (${columns}) VALUES (${placeholders})`;

      const [result]: [OkPacket, FieldPacket[]] = await connection.execute(
        sql,
        values
      );
      return result.insertId;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async update<T>(
    collectionName: string,
    query: Partial<T>,
    data: Partial<T>
  ): Promise<number> {
    let connection: PoolConnection | null = null;
    try {
      connection = await this.databaseHandler.getConnection();
      const setData = this.mapEntityToRowData(data);
      const whereData = this.mapEntityToRowData(query);

      const setClause = Object.keys(setData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const whereClause = Object.keys(whereData)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const values = [...Object.values(setData), ...Object.values(whereData)];
      const sql = `UPDATE ${collectionName} SET ${setClause} WHERE ${whereClause}`;

      const [result]: [OkPacket, FieldPacket[]] = await connection.execute(
        sql,
        values
      );
      return result.affectedRows;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async remove(collectionName: string, query: Partial<any>): Promise<number> {
    let connection: PoolConnection | null = null;
    try {
      connection = await this.databaseHandler.getConnection();
      const whereData = this.mapEntityToRowData(query);
      const whereClause = Object.keys(whereData)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const values = Object.values(whereData);
      const sql = `DELETE FROM ${collectionName} WHERE ${whereClause}`;

      const [result]: [OkPacket, FieldPacket[]] = await connection.execute(
        sql,
        values
      );
      return result.affectedRows;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}
