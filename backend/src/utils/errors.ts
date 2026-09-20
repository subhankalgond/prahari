export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}
export function unauthorized(message = 'Authentication required'): HttpError {
  return new HttpError(401, message);
}
export function forbidden(message = 'You do not have access to this resource'): HttpError {
  return new HttpError(403, message);
}
export function notFound(message = 'Not found'): HttpError {
  return new HttpError(404, message);
}
export function conflict(message: string): HttpError {
  return new HttpError(409, message);
}
