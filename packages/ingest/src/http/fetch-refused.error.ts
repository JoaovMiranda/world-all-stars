/** A request the safe fetcher refuses to make (protocol, host, address, size, type or redirect rule). */
export class FetchRefusedError extends Error {
  constructor(
    readonly url: string,
    readonly reason: string,
  ) {
    super(`Refused ${url}: ${reason}`);
    this.name = 'FetchRefusedError';
  }
}
