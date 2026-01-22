import { getAll, getOne, runSQL } from '../index';

/**
 * Base repository interface for common CRUD operations
 */
export interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | undefined>;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<number>;
  update(id: number, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<void>;
  delete(id: number): Promise<void>;
  count(): Promise<number>;
}

/**
 * Base repository implementation with common CRUD operations
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  protected tableName: string;
  protected primaryKey: string = 'id';

  constructor(tableName: string, primaryKey: string = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    return getAll<T>(sql);
  }

  /**
   * Find a record by ID
   */
  async findById(id: number): Promise<T | undefined> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    return getOne<T>(sql, [id]);
  }

  /**
   * Count total records
   */
  async count(): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = getOne<{ count: number }>(sql);
    return result?.count ?? 0;
  }

  /**
   * Create a new record
   * Must be implemented by subclasses
   */
  abstract create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<number>;

  /**
   * Update an existing record
   * Must be implemented by subclasses
   */
  abstract update(id: number, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<void>;

  /**
   * Delete a record
   */
  async delete(id: number): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    await runSQL(sql, [id]);
  }

  /**
   * Helper method to build UPDATE query dynamically
   */
  protected buildUpdateQuery(data: Record<string, unknown>): { sql: string; values: unknown[] } {
    const fields = Object.keys(data).filter((key) => key !== 'id' && key !== 'created_at');
    const values = fields.map((field) => data[field]);
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    
    return {
      sql: `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${this.primaryKey} = ?`,
      values: [...values, data.id],
    };
  }

  /**
   * Helper method to build INSERT query dynamically
   */
  protected buildInsertQuery(data: Record<string, unknown>): { sql: string; values: unknown[] } {
    const fields = Object.keys(data).filter((key) => 
      key !== 'id' && 
      key !== 'created_at' && 
      key !== 'updated_at' && 
      data[key] !== undefined
    );
    const values = fields.map((field) => data[field]);
    const placeholders = fields.map(() => '?').join(', ');
    
    return {
      sql: `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
      values,
    };
  }
}

