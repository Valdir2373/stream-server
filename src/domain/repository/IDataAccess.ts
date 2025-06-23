export interface IDataAccess {
  findMany<T>(
    collectionName: string,
    query?: Partial<T>,
    selectFields?: (keyof T)[]
  ): Promise<T[]>;
  findOne<T>(
    collectionName: string,
    query: Partial<T>,
    selectFields?: (keyof T)[]
  ): Promise<T | undefined>;
  create<T>(
    collectionName: string,
    data: Partial<T>
  ): Promise<string | number | undefined>;
  update<T>(
    collectionName: string,
    query: Partial<T>,
    data: Partial<T>
  ): Promise<number>;
  remove(collectionName: string, query: Partial<any>): Promise<number>;
}
