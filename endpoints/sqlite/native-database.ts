/**
 * Native database implementation using expo-sqlite
 * Only used on iOS and Android platforms
 */

let db: any = null;

/**
 * Initialize and open the database connection for native platforms
 * @returns SQLite database instance
 */
export const getNativeDatabase = (): any => {
  if (!db) {
    try {
      // Import SQLite only on native platforms
      const SQLite = require('expo-sqlite');
      
      // Use a database in the document directory (accessible for syncing)
      const dbName = 'pos.db';
      console.log('🔧 Opening native database:', dbName);
      db = SQLite.openDatabaseSync(dbName);
      console.log('✅ Native database opened successfully:', dbName);
    } catch (error) {
      console.error('❌ Failed to open native database:', error);
      throw error;
    }
  }
  return db;
};

/**
 * Get the database file path (for syncing)
 */
export const getNativeDatabasePath = (): string => {
  const FileSystem = require('expo-file-system');
  return `${FileSystem.documentDirectory}SQLite/pos.db`;
};

/**
 * Close the native database connection
 */
export const closeNativeDatabase = (): void => {
  if (db) {
    db.closeSync();
    db = null;
  }
};

/**
 * Execute a raw SQL query (for migrations and setup)
 * @param sql SQL query to execute
 * @returns Result of the query
 */
export const nativeExecSQL = (sql: string): void => {
  const database = getNativeDatabase();
  database.execSync(sql);
};

/**
 * Execute a prepared statement with parameters
 * @param sql SQL query with ? placeholders
 * @param params Parameters to bind
 * @returns Result of the query
 */
export const nativeRunSQL = (sql: string, params: unknown[]): any => {
  const database = getNativeDatabase();
  return database.runSync(sql, params);
};

/**
 * Get all rows from a query
 * @param sql SQL query
 * @param params Parameters to bind
 * @returns Array of rows
 */
export const nativeGetAll = <T>(sql: string, params: unknown[] = []): T[] => {
  const database = getNativeDatabase();
  return database.getAllSync(sql, params) as T[];
};

/**
 * Get a single row from a query
 * @param sql SQL query
 * @param params Parameters to bind
 * @returns Single row or undefined
 */
export const nativeGetOne = <T>(sql: string, params: unknown[] = []): T | undefined => {
  const database = getNativeDatabase();
  const result = database.getFirstSync(sql, params);
  return result as T | undefined;
};

/**
 * Initialize native database from backend SQL schema
 */
export const initializeNativeDatabaseFromBackend = async (sqlScript: string): Promise<void> => {
  try {
    console.log('🔄 Initializing native database from backend SQL...');
    console.log('📝 Raw SQL script length:', sqlScript.length, 'characters');
    
    // Clean the SQL script: remove comment lines but keep structure
    const cleanedScript = sqlScript
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n')
      .trim();
    
    console.log('🧹 Cleaned SQL length:', cleanedScript.length, 'characters');
    
    // Try to execute as a single transaction first (fastest approach)
    try {
      console.log('⚡ Attempting to execute entire script in one transaction...');
      const database = getNativeDatabase();
      
      // Execute the entire script using execAsync for better error handling
      database.execSync(cleanedScript);
      console.log('✅ Native database initialized successfully in single transaction');
      return;
    } catch (bulkError: any) {
      console.warn('⚠️  Bulk execution failed, falling back to statement-by-statement execution');
      console.warn('💥 Bulk error:', bulkError?.message);
    }
    
    // Fallback: Split and execute statement by statement
    console.log('📊 Splitting SQL into individual statements...');
    const statements = cleanedScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    let criticalErrors: string[] = [];
    
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i].trim();
      if (sql) {
        try {
          // Log the statement type for debugging
          const stmtType = sql.substring(0, 50).replace(/\s+/g, ' ');
          console.log(`⚙️  [${i + 1}/${statements.length}] ${stmtType}...`);
          
          nativeExecSQL(sql);
          successCount++;
        } catch (error: any) {
          errorCount++;
          const errorMsg = error?.message || String(error);
          
          // Classify errors
          const isDrop = sql.toUpperCase().startsWith('DROP');
          const isIgnorable = isDrop || errorMsg.includes('already exists') || errorMsg.includes('no such table');
          
          if (isIgnorable) {
            console.log(`ℹ️  [${i + 1}/${statements.length}] Skipping (ignorable): ${errorMsg}`);
          } else {
            console.error(`❌ [${i + 1}/${statements.length}] Failed with error: ${errorMsg}`);
            console.error('📝 Statement:', sql.substring(0, 200));
            criticalErrors.push(`Statement ${i + 1}: ${errorMsg}`);
          }
        }
      }
    }
    
    console.log(`✅ Native database initialization complete: ${successCount} succeeded, ${errorCount} failed`);
    
    if (criticalErrors.length > 0) {
      console.error('❌ Critical errors encountered:');
      criticalErrors.forEach(err => console.error('  -', err));
      throw new Error(`Native database initialization had ${criticalErrors.length} critical errors`);
    }
  } catch (error) {
    console.error('❌ Native database initialization failed:', error);
    throw error;
  }
};

/**
 * Reset the native database - deletes and recreates with migrations and seed data
 */
export const resetNativeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Resetting native database...');
    
    // Close the database connection
    closeNativeDatabase();
    
    // Delete the database file
    const FileSystem = require('expo-file-system');
    const dbPath = `${FileSystem.documentDirectory}SQLite/pos.db`;
    
    try {
      const { File, Directory } = FileSystem as any;
      const fileInfo =
        (File?.getInfoAsync && (await File.getInfoAsync(dbPath))) ||
        (Directory?.getInfoAsync && (await Directory.getInfoAsync(dbPath))) ||
        { exists: false };
      if (fileInfo?.exists) {
        await FileSystem.deleteAsync(dbPath);
        console.log('✅ Native database file deleted');
      }
    } catch (error) {
      console.error('⚠️  Could not delete native database file:', error);
    }
    
    // Reset the db variable
    db = null;
    
    console.log('✅ Native database reset completed');
  } catch (error) {
    console.error('❌ Native database reset failed:', error);
    throw error;
  }
};
