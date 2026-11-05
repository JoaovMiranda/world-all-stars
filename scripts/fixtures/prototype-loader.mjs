// Loads the HTML prototype's mock DB + API (browser globals injected by mock/load.js via document.write)
// inside a node:vm context with a fake window/document, in the SAME order as load.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const LOAD_JS_FILE_LIST = /\[([^\]]*db\/schema\.js[^\]]*)\]/s;

/** Reads the ordered file list straight from mock/load.js, so the loader never drifts from the prototype. */
const readLoadOrder = (mockDir) => {
  const source = fs.readFileSync(path.join(mockDir, 'load.js'), 'utf8');
  const match = source.match(LOAD_JS_FILE_LIST);
  if (!match) throw new Error('Could not find the file list in mock/load.js');
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((f) => !f.includes('session.helper'));
};

/** Returns the vm global (window) after running schema → db → seeds → API. */
export const loadPrototype = (mockDir) => {
  const context = { console, URL, Date, Math, JSON, Intl };
  context.window = context;
  context.document = { currentScript: { src: '' }, write() {} };
  vm.createContext(context);
  const files = readLoadOrder(mockDir);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(mockDir, file), 'utf8'), context, { filename: file });
  if (!context.WAS_API || !context.WAS_DB) throw new Error('Prototype did not expose WAS_API / WAS_DB');
  return { api: context.WAS_API, db: context.WAS_DB, schema: context.WAS_DB_SCHEMA, catalog: context.WAS_CATALOG, collectionRuns: context.WAS_COLLECTION_RUNS ?? [], collectedSports: context.WAS_COLLECTED_SPORTS ?? [], files };
};
