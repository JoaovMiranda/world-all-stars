export class VersionConflictError extends Error {
  constructor(
    readonly entityType: string,
    readonly entityId: string,
    readonly expected: number,
    readonly actual: number,
  ) {
    super(`Version conflict on ${entityType}/${entityId}: expected v${expected}, found v${actual}`);
    this.name = 'VersionConflictError';
  }
}
