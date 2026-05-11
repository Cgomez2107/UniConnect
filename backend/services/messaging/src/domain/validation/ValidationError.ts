export class ValidationError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? `Validation failed: ${code}`);
    this.name = "ValidationError";
  }
}
