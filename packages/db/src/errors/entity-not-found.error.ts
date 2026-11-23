export class EntityNotFoundError extends Error {
  constructor(
    readonly entityType: string,
    readonly entityId: string,
  ) {
    super(`${entityType}/${entityId} not found`);
    this.name = 'EntityNotFoundError';
  }
}
