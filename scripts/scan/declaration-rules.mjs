#!/usr/bin/env node
// Checks the "one declaration kind per file" rules of handoff T0.3 (conventions §5.1) without ESLint, which is
// deferred while the repo is on TypeScript 7 (see docs/engineering/tooling.md). Same oxc parser as mixed-declarations.
//
// Rules (tests, *.d.ts and migrations are skipped):
//   interface   no `interface` outside *.interface.ts / *.type.ts (React *.component.tsx / *.page.tsx may keep `Props`)
//   type        no exported `type` alias outside *.interface.ts / *.type.ts / *.enum.ts / *.component.tsx / *.page.tsx
//   const       no exported SCREAMING_SNAKE const outside *.const.ts / *.enum.ts / *.table.ts / *.seed.ts / *.config.ts
//   enum        no enum pattern (exported SCREAMING-or-Pascal const object `as const` + same-name type) outside packages/shared/src/enums/
//   class       no class in *.helper.ts; at most one exported class per file
//
// Usage: node scripts/scan/declaration-rules.mjs [--details] [--fail] [dir ...]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DEFAULT_DIRS = ['apps/server/src', 'packages/db/src', 'packages/ingest/src', 'packages/ranking/src', 'packages/shared/src', 'apps/web/src'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'migrations', '.turbo']);
const SCREAMING = /^[A-Z][A-Z0-9_]*$/;

const argv = process.argv.slice(2);
const details = argv.includes('--details');
const fail = argv.includes('--fail');
const dirArgs = argv.filter((a) => !a.startsWith('--'));
const dirs = dirArgs.length > 0 ? dirArgs : DEFAULT_DIRS;

const viteRequire = createRequire(createRequire(join(ROOT, 'apps/web/package.json')).resolve('vite/package.json'));
const { parseAst } = await import(pathToFileURL(viteRequire.resolve('rolldown/parseAst')).href);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) && !name.endsWith('.d.ts')) yield full;
  }
}

const unwrap = (statement) =>
  statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
    ? { node: statement.declaration, exported: true }
    : { node: statement, exported: false };

const isAsConstObject = (init) => init?.type === 'TSAsExpression' && init.expression?.type === 'ObjectExpression' && init.typeAnnotation?.typeName?.name === 'const';

function violationsOf(path, body) {
  const name = path.split('/').pop();
  const typeFile = /\.(interface|type)\.ts$/.test(name);
  const enumFile = /\.enum\.ts$/.test(name);
  const reactFile = /\.(component|page)\.tsx$/.test(name);
  const constFile = /\.(const|enum|table|seed|config)\.ts$/.test(name) || /\.const\.(en|es)\.ts$/.test(name);
  const helperFile = /\.helper\.ts$/.test(name);
  const inEnums = path.startsWith('packages/shared/src/enums/');
  const out = [];
  const exportedTypes = new Set();
  const asConst = [];
  let exportedClasses = 0;

  for (const statement of body) {
    const { node, exported } = unwrap(statement);
    if (!node) continue;
    const line = statement.start;
    if (node.type === 'TSInterfaceDeclaration' && !typeFile && !(reactFile && /Props$/.test(node.id.name))) out.push(['interface', node.id.name, line]);
    if (node.type === 'TSTypeAliasDeclaration') {
      if (exported) exportedTypes.add(node.id.name);
      if (exported && !typeFile && !reactFile && !enumFile) out.push(['type', node.id.name, line]);
    }
    if (node.type === 'VariableDeclaration' && exported && node.kind === 'const') {
      for (const d of node.declarations) {
        const id = d.id?.name ?? '';
        if (SCREAMING.test(id) && !constFile) out.push(['const', id, line]);
        if (isAsConstObject(d.init)) asConst.push([id, line]);
      }
    }
    if (node.type === 'ClassDeclaration') {
      if (helperFile) out.push(['class', `${node.id?.name ?? '(anonymous)'} in helper`, line]);
      if (exported) exportedClasses += 1;
    }
  }
  if (!inEnums) for (const [id, line] of asConst) if (exportedTypes.has(id)) out.push(['enum', id, line]);
  if (exportedClasses > 1) out.push(['class', `${exportedClasses} exported classes`, 0]);
  return out;
}

const results = [];
const totals = { interface: 0, type: 0, const: 0, enum: 0, class: 0 };
for (const dir of dirs) {
  for (const file of walk(join(ROOT, dir))) {
    const path = relative(ROOT, file);
    const ast = parseAst(readFileSync(file, 'utf8'), { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' });
    const violations = violationsOf(path, ast.body);
    if (violations.length === 0) continue;
    for (const [rule] of violations) totals[rule] += 1;
    results.push({ path, violations });
  }
}

const count = results.reduce((sum, r) => sum + r.violations.length, 0);
console.log(`Declaration-rule violations: ${count} in ${results.length} files (${Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(', ')})\n`);
for (const { path, violations } of results.sort((a, b) => a.path.localeCompare(b.path))) {
  const summary = Object.entries(Object.groupBy(violations, ([rule]) => rule)).map(([rule, list]) => `${rule} ${list.length}`).join(', ');
  console.log(`- ${path}: ${summary}`);
  if (details) for (const [rule, what] of violations) console.log(`    ${rule}: ${what}`);
}
if (fail && count > 0) process.exit(1);
