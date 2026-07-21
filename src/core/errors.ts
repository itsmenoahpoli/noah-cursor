export class NoahError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, code = "NOAH_ERROR", details?: unknown) {
    super(message);
    this.name = "NoahError";
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends NoahError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class RegistryError extends NoahError {
  constructor(message: string, details?: unknown) {
    super(message, "REGISTRY_ERROR", details);
    this.name = "RegistryError";
  }
}

export class NotFoundError extends NoahError {
  constructor(message: string, details?: unknown) {
    super(message, "NOT_FOUND", details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends NoahError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

export class MetadataError extends NoahError {
  constructor(message: string, details?: unknown) {
    super(message, "METADATA_ERROR", details);
    this.name = "MetadataError";
  }
}

export function isNoahError(error: unknown): error is NoahError {
  return error instanceof NoahError;
}
