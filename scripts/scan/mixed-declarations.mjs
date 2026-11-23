#!/usr/bin/env node
// Lists source files whose top-level statements declare two or more declaration kinds
// (type-like = interface/type alias, SCREAMING_SNAKE const, function, class) — see conventions §5.1.
//
// TypeScript 7 (native) ships no JavaScript compiler API, so this script parses with the
// oxc-based `rolldown/parseAst` that Vite already brings in (resolved through apps/web).
//
// Usage: node scripts/scan/mixed-declarations.mjs [--min 2] [dir ...]
// Output: markdown table "path | kinds" on stdout.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DEFAULT_DIRS = ['apps/server/src', 'apps/web/src', 'packages/db/src', 'packages/ingest/src', 'packages/ranking/src', 'packages/shared/src'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'migrations', '.turbo']);
const SCREAMING = /^[A-Z][A-Z0-9_]*$/;

const args = process.argv.slice(2);
const minIndex = args.indexOf('--min');
const minKinds = minIndex >= 0 ? Number(args.splice(minIndex, 2)[1]) : 2;
const dirs = args.length > 0 ? args : DEFAULT_DIRS;

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

function kindsOf(statement) {
  const node = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' ? (statement.declaration ?? statement) : statement;
  switch (node.type) {
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
      return ['type'];
    case 'TSEnumDeclaration':
      return ['enum'];
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
      return ['function'];
    case 'ClassDeclaration':
      return ['class'];
    case 'VariableDeclaration': {
      const kinds = [];
      for (const declarator of node.declarations) {
        const name = declarator.id?.name ?? '';
        const init = declarator.init?.type ?? '';
        if (node.kind === 'const' && SCREAMING.test(name)) kinds.push('const');
        else if (init === 'ArrowFunctionExpression' || init === 'FunctionExpression') kinds.push('function');
      }
      return kinds;
    }
    default:
      return [];
  }
}

const rows = [];
let failed = 0;
for (const dir of dirs) {
  for (const file of walk(join(ROOT, dir))) {
    let ast;
    try {
      ast = parseAst(readFileSync(file, 'utf8'), { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' });
    } catch {
      failed += 1;
      continue;
    }
    const kinds = new Set(ast.body.flatMap(kindsOf));
    if (kinds.size >= minKinds) rows.push([relative(ROOT, file), [...kinds].sort().join(', '), kinds.size]);
  }
}

rows.sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0]));
console.log(`Files with >= ${minKinds} declaration kinds: ${rows.length}${failed ? ` (parse failures: ${failed})` : ''}\n`);
console.log('| Path | Kinds | Count |\n|---|---|---|');
for (const [path, kinds, count] of rows) console.log(`| \`${path}\` | ${kinds} | ${count} |`);
