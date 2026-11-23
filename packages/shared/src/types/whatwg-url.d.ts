// WHATWG URL globals exist in every runtime the shared package targets (browsers, Node ≥ 18, workers),
// but the package compiles without DOM/Node libs on purpose. Minimal ambient surface used by the helpers.
declare class URL {
  constructor(input: string, base?: string);
  readonly hostname: string;
  readonly href: string;
  readonly password: string;
  readonly protocol: string;
  readonly username: string;
}
declare class URLSearchParams {
  constructor(init?: Record<string, string>);
  set(name: string, value: string): void;
  toString(): string;
}
