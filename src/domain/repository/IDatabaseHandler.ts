export interface IDatabaseHandler<T> {
  getConnection(): Promise<T>;

  closePool(): Promise<void>;
}
