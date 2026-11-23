/** Schema of the HTML prototype's simulated database: foreign keys of each table. */
export interface ProtoSchema {
  tables: Record<string, { fk: Record<string, string> }>;
}
