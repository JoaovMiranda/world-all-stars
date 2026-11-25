import { createDatabase, selectRows } from '@was/db';
import { sql } from 'drizzle-orm';
const h = await createDatabase({ pgliteDataDir: process.env.PGLITE_DATA_DIR! });
const rows = await selectRows<any>(h.db, sql.raw(process.argv[2]!));
console.log(JSON.stringify(rows));
await h.close();
