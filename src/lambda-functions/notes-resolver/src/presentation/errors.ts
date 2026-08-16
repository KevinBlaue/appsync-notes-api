export class GraphqlRequestError extends Error {
  constructor(
    readonly code: 'INVALID_ARGUMENT' | 'UNSUPPORTED_FIELD',
    message: string
  ) {
    super(`[${code}] ${message}`);
    this.name = 'GraphqlRequestError';
  }
}
