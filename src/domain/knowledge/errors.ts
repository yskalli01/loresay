export class KnowledgeDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "KnowledgeDomainError";
  }
}

export function invariant(
  condition: boolean,
  message: string,
  code: string,
): asserts condition {
  if (!condition) {
    throw new KnowledgeDomainError(message, code);
  }
}
