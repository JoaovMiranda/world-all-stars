import type { RegisteredProvider } from '../interfaces/registered-provider.interface';
import type { IngestContext } from './context';

/** The single provider map shared by the CLI (`pnpm ingest`), the job worker and the admin ingestion runner. */
export class ProviderRegistry {
  private readonly providers = new Map<string, RegisteredProvider>();

  constructor(providers: readonly RegisteredProvider[] = []) {
    for (const provider of providers) this.register(provider);
  }

  register(provider: RegisteredProvider): this {
    if (this.providers.has(provider.key)) throw new Error(`Provider ${provider.key} is already registered`);
    this.providers.set(provider.key, provider);
    return this;
  }

  has(key: string): boolean {
    return this.providers.has(key);
  }

  get(key: string): RegisteredProvider {
    const provider = this.providers.get(key);
    if (!provider) throw new Error(`Unknown provider ${key} (registered: ${this.keys().join(', ') || 'none'})`);
    return provider;
  }

  keys(): string[] {
    return [...this.providers.keys()].sort();
  }

  run(key: string, ctx: IngestContext, params: Record<string, unknown> = {}): Promise<string[]> {
    return this.get(key).runWith(ctx, params);
  }
}
