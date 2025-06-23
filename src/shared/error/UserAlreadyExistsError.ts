export class UserAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserAlreadyExistsError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserAlreadyExistsError);
    }
  }
}
