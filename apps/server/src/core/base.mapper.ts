/** Base of every mapper: turns a database/read-model row into a contract DTO. Pure (no I/O). */
export abstract class BaseMapper<Row, Dto> {
  abstract map(row: Row): Dto;

  mapMany(rows: readonly Row[]): Dto[] {
    return rows.map((row) => this.map(row));
  }
}
