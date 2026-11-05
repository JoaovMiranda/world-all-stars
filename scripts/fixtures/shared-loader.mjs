// Imports @was/shared straight from its TypeScript sources (Node type stripping) so the script validates with the
// exact same Zod schemas as the app. Extensionless relative imports get ".ts" appended by a resolve hook.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});

export const loadShared = (sharedIndexUrl) => import(sharedIndexUrl);
