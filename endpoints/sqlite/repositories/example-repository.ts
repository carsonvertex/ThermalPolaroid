import { getAll, runSQL } from '../index';
import { BaseRepository } from './base-repository';

export interface ExampleItem {
  id: number;
  title: string;
  description: string | null;
  completed: number; // SQLite boolean (0/1)
  created_at: string;
  updated_at: string;
}

export class ExampleRepository extends BaseRepository<ExampleItem> {
  constructor() {
    super('example');
  }

  /**
   * Create a new example item
   */
  async create(data: Omit<ExampleItem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { sql, values } = this.buildInsertQuery(data as Record<string, unknown>);
    const result = runSQL(sql, values);
    return result.lastInsertRowId;
  }

  /**
   * Update an existing example item
   */
  async update(id: number, data: Partial<Omit<ExampleItem, 'id' | 'created_at'>>): Promise<void> {
    const { sql, values } = this.buildUpdateQuery({ ...data, id } as Record<string, unknown>);
    runSQL(sql, values);
  }

  /**
   * Toggle completion status
   */
  async toggleComplete(id: number): Promise<void> {
    const sql = 'UPDATE example SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    runSQL(sql, [id]);
  }

  /**
   * Get all incomplete items
   */
  async getIncomplete(): Promise<ExampleItem[]> {
    const sql = 'SELECT * FROM example WHERE completed = 0 ORDER BY created_at DESC';
    return getAll<ExampleItem>(sql);
  }

  /**
   * Get all completed items
   */
  async getCompleted(): Promise<ExampleItem[]> {
    const sql = 'SELECT * FROM example WHERE completed = 1 ORDER BY created_at DESC';
    return getAll<ExampleItem>(sql);
  }
}

// Export singleton instance
export const exampleRepository = new ExampleRepository();

