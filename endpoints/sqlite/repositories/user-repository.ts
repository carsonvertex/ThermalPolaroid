import { getOne, runSQL } from '../index';
import { User } from '../schema';
import { BaseRepository } from './base-repository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * Create a new user
   */
  async create(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { sql, values } = this.buildInsertQuery(data as Record<string, unknown>);
    const result = runSQL(sql, values);
    return result.lastInsertRowId;
  }

  /**
   * Update an existing user
   */
  async update(id: number, data: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
    const { sql, values } = this.buildUpdateQuery({ ...data, id } as Record<string, unknown>);
    runSQL(sql, values);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return getOne<User>(sql, [email]);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | undefined> {
    const sql = 'SELECT * FROM users WHERE name = ? OR email = ?';
    return getOne<User>(sql, [username, username]);
  }

  /**
   * Find users by role
   */
  async findByRole(role: User['role']): Promise<User[]> {
    const sql = 'SELECT * FROM users WHERE role = ? AND is_active = 1 ORDER BY name';
    return (await import('../index')).getAll(sql, [role]);
  }

  /**
   * Soft delete user (set is_active = 0)
   */
  async softDelete(id: number): Promise<void> {
    const sql = 'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    runSQL(sql, [id]);
  }

  /**
   * Activate user
   */
  async activate(id: number): Promise<void> {
    const sql = 'UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    runSQL(sql, [id]);
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    
    if (!user || user.is_active === 0) {
      return null;
    }

    // Simple password verification (for demo purposes)
    // In production, use proper bcrypt or similar
    const isValid = this.verifyPassword(password, user.password_hash);
    
    return isValid ? user : null;
  }

  /**
   * Authenticate user with username and password
   * Compatible with backend user schema (username field)
   */
  async authenticateByUsername(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    
    if (!user || user.is_active === 0) {
      return null;
    }

    // Simple password verification (for demo purposes)
    // In production, use proper bcrypt or similar
    const isValid = this.verifyPassword(password, user.password_hash);
    
    return isValid ? user : null;
  }

  /**
   * Hash password (simple implementation for demo)
   * In production, use proper bcrypt or expo-crypto
   */
  hashPassword(password: string): string {
    // Simple hash for demo - in production use bcrypt
    // This is just a placeholder - NOT secure for production!
    return `hashed_${password}_demo`;
  }

  /**
   * Verify password against hash
   */
  private verifyPassword(password: string, hash: string): boolean {
    // Simple verification for demo
    return this.hashPassword(password) === hash;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();

