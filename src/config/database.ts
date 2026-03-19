import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from './index';
import { logger } from '../utils/logger';

let db: SqlJsDatabase | null = null;

export async function initializeDatabase(): Promise<SqlJsDatabase> {
    if (db) return db;

    const SQL = await initSqlJs();
    const dbPath = path.resolve(process.cwd(), config.database.path);
    const dbDir = path.dirname(dbPath);

    // Ensure the data directory exists
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
        logger.info(`Database loaded from ${dbPath}`);
    } else {
        db = new SQL.Database();
        logger.info(`New database created at ${dbPath}`);
    }

    // Enable WAL mode and foreign keys
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');

    return db;
}

export function getDatabase(): SqlJsDatabase {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

export function saveDatabase(): void {
    if (!db) return;

    const dbPath = path.resolve(process.cwd(), config.database.path);
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

// Auto-save on interval (every 30 seconds)
let saveInterval: NodeJS.Timeout | null = null;

export function startAutoSave(intervalMs: number = 30000): void {
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(() => {
        try {
            saveDatabase();
        } catch (err) {
            logger.error('Auto-save failed:', err);
        }
    }, intervalMs);
}

export function stopAutoSave(): void {
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
}
