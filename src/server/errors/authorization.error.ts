export class AuthorizationError extends Error {
  constructor(
    message = "No tienes permisos para realizar esta acción."
  ) {
    super(message);

    this.name = "AuthorizationError";
  }
}