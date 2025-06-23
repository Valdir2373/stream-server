export interface IUserToCheckRepository {
  getUserToCheck(email: string): Promise<string | null>;
  deleteUserChecked(id: string): Promise<boolean>;
}
