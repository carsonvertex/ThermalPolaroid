import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { apiClient } from '../../lib/api/client';


let db: any = null;
let lastKnownDatabasePath: string | null = null;

const toFileUri = (path: string): string => {
  if (!path) return path;
  return path.startsWith('file://') ? path : `file://${path}`;
};

const getDbPathFromConnection = (connection: any): string | undefined => {
  return connection?.databasePath || connection?.nativeDatabase?.databasePath;
};

const closeConnection = async (connection: any): Promise<void> => {
  try {
    if (typeof connection.closeAsync === 'function') {
      await connection.closeAsync();
    } else if (typeof connection.closeSync === 'function') {
      connection.closeSync();
    } else if (connection?.nativeDatabase?.close) {
      connection.nativeDatabase.close();
    }
  } catch {}
};

const resolveDatabasePath = async (): Promise<string> => {
  const openedPath = db ? getDbPathFromConnection(db) : undefined;
  if (openedPath) {
    lastKnownDatabasePath = openedPath;
    return openedPath;
  }
  if (lastKnownDatabasePath) {
    return lastKnownDatabasePath;
  }
  try {
    const SQLite = require('expo-sqlite');
    const temp = SQLite.openDatabaseSync 
      ? SQLite.openDatabaseSync('pos.db') 
      : await SQLite.openDatabaseAsync('pos.db');
    const tempPath = getDbPathFromConnection(temp);
    await closeConnection(temp);
    if (tempPath) {
      lastKnownDatabasePath = tempPath;
      return tempPath;
    }
  } catch {}
  const documentDir = (FileSystem as any).documentDirectory ?? '';
  return `${documentDir}SQLite/pos.db`;
};

export const isSQLiteAvailable = (): boolean => {
  return Platform.OS !== 'web';
};

export const getDatabase = async (): Promise<any> => {
  // Don't load SQLite on web
  if (!isSQLiteAvailable()) {
    throw new Error('SQLite is not available on web. Use iOS or Android.');
  }
  if (!db) {
    try {
      let SQLite;
      try {
        SQLite = require('expo-sqlite');
      } catch (importError) {
        console.error('❌ Failed to import expo-sqlite:', importError);
        throw new Error('expo-sqlite is not available on this platform');
      }
      // Use a database in the document directory (accessible for syncing)
      const dbName = 'pos.db';
      // Use Expo FileSystem document directory (has file:// prefix)
      const documentDir = (FileSystem as any).documentDirectory ?? '';
      const sqliteDir = `${documentDir}SQLite`;
      const fullDbPath = `${sqliteDir}/${dbName}`;
      
      // Ensure the SQLite directory exists
      try {
        const { File, Directory } = FileSystem as any;
        const dirInfo =
          (Directory?.getInfoAsync && (await Directory.getInfoAsync(sqliteDir))) ||
          (File?.getInfoAsync && (await File.getInfoAsync(sqliteDir))) ||
          { exists: false };
        if (!dirInfo?.exists) {
          if (Directory?.makeDirectoryAsync) {
            await Directory.makeDirectoryAsync(sqliteDir, { intermediates: true });
          } else if (File?.makeDirectoryAsync) {
            await File.makeDirectoryAsync(sqliteDir, { intermediates: true });
          } else {
            const Legacy = require('expo-file-system/legacy');
            await Legacy.makeDirectoryAsync(sqliteDir, { intermediates: true });
          }
          console.log('✅ Created SQLite directory:', sqliteDir);
        }
      } catch (dirError) {
        console.warn('⚠️  Could not ensure SQLite directory exists:', dirError);
        // Continue anyway - SQLite might create it automatically
      }
      
      console.log('🔧 Opening database:', dbName);
      console.log('🔧 Database path:', fullDbPath);
      
      // Open the database
      try {
        db = await SQLite.openDatabaseAsync(dbName);
      } catch (openError: any) {
        console.error('❌ Failed to open database:', openError);
        console.error('❌ Error details:', {
          message: openError?.message,
          code: openError?.code,
          stack: openError?.stack
        });
        throw openError;
      }
      
      // Validate the database connection
      if (!db) {
        throw new Error('Database connection is null after opening');
      }
      
      // Check if execAsync method exists
      if (typeof db.execAsync !== 'function') {
        console.error('❌ Database object does not have execAsync method');
        console.error('❌ Database object keys:', Object.keys(db || {}));
        throw new Error('Database connection is invalid - execAsync method not available');
      }
      
      const reportedPath = getDbPathFromConnection(db) || fullDbPath;
      lastKnownDatabasePath = reportedPath;
      
      // Test the connection with a simple query
      try {
        await db.execAsync('SELECT 1;');
        console.log('✅ Database connection validated');
      } catch (testError) {
        console.error('❌ Database connection test failed:', testError);
        db = null; // Reset db so it can be retried
        throw new Error(`Database connection test failed: ${testError}`);
      }
      
      // Enable WAL mode for better concurrency
      try {
        await db.execAsync('PRAGMA journal_mode = WAL;');
        console.log('✅ WAL mode enabled');
      } catch (walError) {
        console.warn('⚠️  Could not enable WAL mode:', walError);
      }
      
      await logDatabaseLocation();
    } catch (error) {
      console.error('❌ Failed to open database:', error);
      db = null; // Reset on error
      throw error;
    }
  }
  
  // Validate database before returning
  if (!db || typeof db.execAsync !== 'function') {
    console.error('❌ Database connection is invalid, resetting...');
    db = null;
    return await getDatabase(); // Retry
  }
  
  return db;
};

export const getDatabasePath = async (): Promise<string> => {
  if (!isSQLiteAvailable()) {
    throw new Error('SQLite is not available on web');
  }
  return resolveDatabasePath();
};

export const logDatabaseLocation = async (): Promise<void> => {
  if (!isSQLiteAvailable()) {
    console.log('🌐 Web platform - no local database file');
    return;
  }
  
  const dbPath = await getDatabasePath();
  const documentDir = (FileSystem as any).documentDirectory ?? '';
  
  console.log('🗄️  DATABASE LOCATION INFO:');
  console.log('📁 Document Directory:', documentDir);
  console.log('📁 Database File:', dbPath);
  console.log('📱 Platform:', Platform.OS);
  console.log('💡 To access via ADB: adb shell run-as com.pos.app ls -la /data/data/com.pos.app/files/');
  console.log('💡 Or check: /storage/emulated/0/Android/data/com.pos.app/files/');
};

export const closeDatabase = async (): Promise<void> => {
  if (!isSQLiteAvailable()) {
    throw new Error('SQLite is not available on web');
  }
  
  if (db) {
    try {
      await closeConnection(db);
    } catch (e) {
      console.warn('⚠️  Failed to close database cleanly:', e);
    } finally {
      db = null;
    }
  }
};

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 100
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || String(error);
      
      // Only retry on database locked errors
      if (errorMsg.includes('database is locked')) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️  Database locked, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For non-lock errors, throw immediately
        throw error;
      }
    }
  }
  
  throw lastError;
};

export const execSQL = async (sql: string): Promise<void> => {
  const database = await getDatabase();
  
  // Validate database connection
  if (!database) {
    throw new Error('Database connection is null');
  }
  
  if (typeof database.execAsync !== 'function') {
    throw new Error('Database execAsync method is not available');
  }
  
  await retryWithBackoff(async () => {
    try {
      await database.execAsync(sql);
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      // If we get a NullPointerException, reset the database connection
      if (errorMsg.includes('NullPointerException') || errorMsg.includes('null')) {
        console.error('❌ NullPointerException detected, resetting database connection...');
        db = null; // Reset the connection
        // Retry with a fresh connection
        const freshDb = await getDatabase();
        return await freshDb.execAsync(sql);
      }
      throw error;
    }
  });
};

export const runSQL = async (sql: string, params: unknown[]): Promise<any> => {
  const database = await getDatabase();
  return await retryWithBackoff(() => database.runAsync(sql, params));
};

export const getAll = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
  console.log('getAll', sql, params);

  const database = await getDatabase();
  if (database.getAllAsync) {
    return await database.getAllAsync(sql, params) as T[];
  } else if (database.getAllSync) {
    return database.getAllSync(sql, params) as T[];
  } else {
    const result = await database.runAsync(sql, params);
    return result.rows || result.rowsAffected || [];
  }
};

export const getOne = async <T>(sql: string, params: unknown[] = []): Promise<T | undefined> => {
  const database = await getDatabase();
  if (database.getFirstAsync) {
    return await database.getFirstAsync(sql, params) as T | undefined;
  } else if (database.getFirstSync) {
    return database.getFirstSync(sql, params) as T | undefined;
  } else {
    const results = await database.getAllAsync(sql, params);
    return results.length > 0 ? results[0] as T : undefined;
  }
};

export const initializeDatabaseFromBackend = async (
  sqlScript?: string
): Promise<{ success: boolean; message: string }> => {
  if (Platform.OS === 'web') {
    return {
      success: false,
      message: 'SQLite is not available on web platform'
    };
  }

  try {
    let sqlToExecute: string;

    // If no SQL script provided, fetch from backend API
    if (!sqlScript) {
      console.log('📡 Fetching database schema from backend...');
      
      interface DatabaseSchemaResponse {
        success: boolean;
        sql: string;
        message: string;
        error?: string;
      }
      
      const response = await apiClient.get<DatabaseSchemaResponse>('/database/schema');
      
      if (!response.success || !response.sql) {
        throw new Error(response.message || 'Failed to fetch SQL schema');
      }
      
      console.log('✅ SQL schema received from backend');
      console.log('📝 SQL length:', response.sql.length, 'characters');
      sqlToExecute = response.sql;
    } else {
      sqlToExecute = sqlScript;
    }

    console.log('🔄 Initializing database from SQL...');
    console.log('📝 Raw SQL script length:', sqlToExecute.length, 'characters');
    
    // Clean the SQL script: remove comment lines but keep structure
    const cleanedScript = sqlToExecute
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n')
      .trim();
    
    console.log('📝 Cleaned SQL length:', cleanedScript.length, 'characters');
    
    // Try to execute as a single transaction first (fastest approach)
    try {
      console.log('⚡ Attempting to execute entire script in one transaction...');
      const database = await getDatabase();
      
      // Execute the entire script using execAsync for better error handling
      await database.execAsync(cleanedScript);
      console.log('✅ Database initialized successfully in single transaction');
      
      return {
        success: true,
        message: 'Database initialized successfully from backend schema'
      };
    } catch (bulkError: any) {
      console.warn('⚠️  Bulk execution failed, falling back to statement-by-statement execution');
      console.warn('⚠️  Bulk error:', bulkError?.message);
    }
    
    // Fallback: Split and execute statement by statement in batches with transactions
    console.log('📋 Splitting SQL into individual statements...');
    const statements = cleanedScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    let criticalErrors: string[] = [];
    
    // Execute in batches using transactions to reduce lock contention
    const BATCH_SIZE = 20;
    let database = await getDatabase();
    
    // Validate database connection before starting
    if (!database || typeof database.execAsync !== 'function') {
      throw new Error('Database connection is invalid before initialization');
    }
    
    for (let batchStart = 0; batchStart < statements.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, statements.length);
      const batch = statements.slice(batchStart, batchEnd);
      
      console.log(`📦 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(statements.length / BATCH_SIZE)} (statements ${batchStart + 1}-${batchEnd})`);
      
      // Re-validate database connection before each batch
      if (!database || typeof database.execAsync !== 'function') {
        console.warn('⚠️  Database connection lost, reconnecting...');
        db = null; // Reset connection
        database = await getDatabase();
      }
      
      // Execute batch in a transaction
      try {
        await retryWithBackoff(async () => {
          if (!database || typeof database.execAsync !== 'function') {
            throw new Error('Database connection is invalid');
          }
          
          await database.execAsync('BEGIN TRANSACTION;');
          
          for (let i = 0; i < batch.length; i++) {
            const sql = batch[i].trim();
            const globalIndex = batchStart + i;
            
            if (sql) {
              try {
                // Re-validate database before each statement
                if (!database || typeof database.execAsync !== 'function') {
                  console.warn('⚠️  Database connection lost during batch, reconnecting...');
                  db = null;
                  database = await getDatabase();
                }
                
                const stmtType = sql.substring(0, 50).replace(/\s+/g, ' ');
                console.log(`  [${globalIndex + 1}/${statements.length}] ${stmtType}...`);
                
                await database.execAsync(sql);
                successCount++;
              } catch (error: any) {
                errorCount++;
                const errorMsg = error?.message || String(error);
                
                // Check for NullPointerException and reset connection
                if (errorMsg.includes('NullPointerException') || errorMsg.includes('null')) {
                  console.error(`❌ [${globalIndex + 1}/${statements.length}] NullPointerException detected, resetting connection...`);
                  db = null;
                  database = await getDatabase();
                  // Try once more with fresh connection
                  try {
                    await database.execAsync(sql);
                    successCount++;
                    errorCount--; // Adjust counts
                    continue;
                  } catch (retryError: any) {
                    // If retry also fails, treat as normal error
                    const retryErrorMsg = retryError?.message || String(retryError);
                    const isDrop = sql.toUpperCase().startsWith('DROP');
                    const isIgnorable = isDrop || retryErrorMsg.includes('already exists') || retryErrorMsg.includes('no such table');
                    
                    if (isIgnorable) {
                      console.log(`ℹ️  [${globalIndex + 1}/${statements.length}] Skipping (ignorable): ${retryErrorMsg}`);
                    } else {
                      console.error(`❌ [${globalIndex + 1}/${statements.length}] Failed after retry: ${retryErrorMsg}`);
                      console.error('❌ Statement:', sql.substring(0, 200));
                      criticalErrors.push(`Statement ${globalIndex + 1}: ${retryErrorMsg}`);
                    }
                  }
                  continue;
                }
                
                // Classify errors
                const isDrop = sql.toUpperCase().startsWith('DROP');
                const isIgnorable = isDrop || errorMsg.includes('already exists') || errorMsg.includes('no such table');
                
                if (isIgnorable) {
                  console.log(`ℹ️  [${globalIndex + 1}/${statements.length}] Skipping (ignorable): ${errorMsg}`);
                } else {
                  console.error(`❌ [${globalIndex + 1}/${statements.length}] Failed with error: ${errorMsg}`);
                  console.error('❌ Statement:', sql.substring(0, 200));
                  criticalErrors.push(`Statement ${globalIndex + 1}: ${errorMsg}`);
                  // Don't break on error, continue with other statements
                }
              }
            }
          }
          
          if (!database || typeof database.execAsync !== 'function') {
            throw new Error('Database connection lost before commit');
          }
          
          await database.execAsync('COMMIT;');
        });
      } catch (transactionError: any) {
        console.warn(`⚠️  Batch transaction failed: ${transactionError?.message}`);
        try {
          if (database && typeof database.execAsync === 'function') {
            await database.execAsync('ROLLBACK;');
          }
        } catch {}
        
        // Retry failed batch statement by statement without transaction
        console.log('🔄 Retrying failed batch statement by statement...');
        for (let i = 0; i < batch.length; i++) {
          const sql = batch[i].trim();
          const globalIndex = batchStart + i;
          
          if (sql) {
            try {
              // Ensure database connection is valid
              if (!database || typeof database.execAsync !== 'function') {
                db = null;
                database = await getDatabase();
              }
              
              await retryWithBackoff(async () => {
                if (!database || typeof database.execAsync !== 'function') {
                  db = null;
                  database = await getDatabase();
                }
                return await database.execAsync(sql);
              });
              successCount++;
            } catch (error: any) {
              errorCount++;
              const errorMsg = error?.message || String(error);
              const isDrop = sql.toUpperCase().startsWith('DROP');
              const isIgnorable = isDrop || errorMsg.includes('already exists') || errorMsg.includes('no such table');
              
              if (!isIgnorable) {
                console.error(`❌ [${globalIndex + 1}/${statements.length}] Failed: ${errorMsg}`);
                criticalErrors.push(`Statement ${globalIndex + 1}: ${errorMsg}`);
              }
            }
          }
        }
      }
      
      // Small delay between batches to prevent overwhelming the database
      if (batchEnd < statements.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`✅ Database initialization complete: ${successCount} succeeded, ${errorCount} failed`);
    
    if (criticalErrors.length > 0) {
      console.error('❌ Critical errors encountered:');
      criticalErrors.forEach(err => console.error('  -', err));
      return {
        success: false,
        message: `Database initialization had ${criticalErrors.length} critical errors: ${criticalErrors.join('; ')}`
      };
    }
    
    return {
      success: true,
      message: 'Database initialized successfully from backend schema'
    };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const initializeDatabaseFromBackendAPI = async (): Promise<{ success: boolean; message: string }> => {
  return initializeDatabaseFromBackend();
};

const getDatabaseFilePaths = (basePath: string): string[] => {
  return [
    basePath,
    `${basePath}-wal`,
    `${basePath}-shm`,
    `${basePath}-journal`
  ];
};

const deleteFileWithNewApi = async (path: string): Promise<boolean> => {
  try {
    const { File } = FileSystem as any;
    const uri = toFileUri(path);
    if (File?.deleteAsync) {
      await File.deleteAsync(uri);
      return true;
    }
    if (File?.fromUri) {
      await File.fromUri(uri).deleteAsync();
      return true;
    }
  } catch {}
  return false;
};

const deleteFileWithLegacyApi = async (path: string): Promise<boolean> => {
  try {
    const LegacyFS = require('expo-file-system/legacy');
    await LegacyFS.deleteAsync(toFileUri(path));
    return true;
  } catch {}
  return false;
};

const deleteDatabaseFiles = async (dbPath: string): Promise<boolean> => {
  const candidates = getDatabaseFilePaths(dbPath);
  let deletedAny = false;
  
  for (const candidate of candidates) {
    if (await deleteFileWithNewApi(candidate) || await deleteFileWithLegacyApi(candidate)) {
      deletedAny = true;
    }
  }
  
  if (deletedAny) return true;
  
  const { File } = FileSystem as any;
  if (File?.getInfoAsync) {
    for (const candidate of candidates) {
      try {
        const info = await File.getInfoAsync(toFileUri(candidate));
        if (info?.exists) {
          if (await deleteFileWithNewApi(candidate) || await deleteFileWithLegacyApi(candidate)) {
            deletedAny = true;
          }
        }
      } catch {}
    }
  }
  
  return deletedAny;
};

const performLogicalReset = async (): Promise<void> => {
  const database = await getDatabase();
  const tables: Array<{ name: string; type: string }> = await getAll(
    "SELECT name, type FROM sqlite_master WHERE type IN ('table','index','trigger','view') AND name NOT LIKE 'sqlite_%'"
  );
  const order = ['trigger', 'view', 'index', 'table'];
  for (const kind of order) {
    for (const entry of tables) {
      if (entry.type === kind) {
        const identifier = entry.name.replace(/[^A-Za-z0-9_]/g, '_');
        await execSQL(`DROP ${entry.type.toUpperCase()} IF EXISTS ${identifier};`);
      }
    }
  }
  await execSQL('VACUUM;');
};

export const resetDatabase = async (): Promise<void> => {
  if (!isSQLiteAvailable()) {
    throw new Error('SQLite is not available on web');
  }

  try {
    console.log('🔄 Resetting database...');
    const dbPath = await resolveDatabasePath();
    await closeDatabase();
    
    const deleted = await deleteDatabaseFiles(dbPath);
    if (!deleted) {
      console.log('ℹ️  Physical delete failed, performing logical reset...');
      await performLogicalReset();
    }
    
    db = null;
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
};

export const isDatabaseInitialized = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"');
    // If there are more than just the migrations table, consider it initialized
    return result ? result.count > 1 : false;
  } catch (error) {
    // If query fails, database is not initialized
    return false;
  }
};

export default getDatabase;

