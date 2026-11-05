import type { z } from 'zod';

type Def = { type: string; [k: string]: unknown };
const defOf = (schema: unknown): Def => (schema as { _zod: { def: Def } })._zod.def;

/**
 * The "empty database" value of any response schema: objects with every key empty, arrays [], nullable → null,
 * optional → undefined, numbers 0, strings '', booleans false, enums/literals/unions → first option.
 * Used by `?fixture=empty` so no page needs a hand-written empty fixture.
 */
export const emptyOf = (schema: z.ZodType): unknown => {
  const def = defOf(schema);
  switch (def.type) {
    case 'object': {
      const shape = def.shape as Record<string, z.ZodType>;
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(shape)) {
        const value = emptyOf(shape[key] as z.ZodType);
        if (value !== undefined) out[key] = value;
      }
      return out;
    }
    case 'array':
    case 'set':
      return [];
    case 'record': {
      // Exhaustive records (enum keys, e.g. votes per tier) get every key; open records stay {}.
      const keys = defOf(def.keyType).type === 'enum' ? Object.values(defOf(def.keyType).entries as Record<string, string>) : [];
      return Object.fromEntries(keys.map((k) => [k, emptyOf(def.valueType as z.ZodType)]));
    }
    case 'map':
      return {};
    case 'nullable':
      return null;
    case 'optional':
    case 'undefined':
    case 'void':
      return undefined;
    case 'default':
      return typeof def.defaultValue === 'function' ? (def.defaultValue as () => unknown)() : def.defaultValue;
    case 'catch':
    case 'readonly':
    case 'nonoptional':
    case 'prefault':
      return emptyOf(def.innerType as z.ZodType);
    case 'pipe':
      return emptyOf(def.out as z.ZodType);
    case 'lazy':
      return emptyOf((def.getter as () => z.ZodType)());
    case 'string':
      return '';
    case 'number':
    case 'int':
      return 0;
    case 'bigint':
      return 0n;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'enum':
      return Object.values(def.entries as Record<string, unknown>)[0];
    case 'literal':
      return (def.values as unknown[])[0];
    case 'union':
      return emptyOf((def.options as z.ZodType[])[0] as z.ZodType);
    case 'intersection':
      return { ...(emptyOf(def.left as z.ZodType) as object), ...(emptyOf(def.right as z.ZodType) as object) };
    case 'tuple':
      return (def.items as z.ZodType[]).map(emptyOf);
    default:
      return undefined;
  }
};
