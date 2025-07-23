import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { promises as fs } from 'fs';

// Database path
// Use Render's persistent disk if available, otherwise use local path
const dbPath = process.env.RENDER
  ? path.join('/var/data', 'shares.db')
  : path.join(process.cwd(), 'data', 'shares.db');
const uploadsPath = path.join(process.cwd(), 'uploads');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.mkdir(uploadsPath, { recursive: true });
}

// Open database connection
export async function openDb() {
  await ensureDirectories();
  
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

// Initialize database schema
export async function initDb() {
  const db = await openDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT,
      filename TEXT,
      mimetype TEXT,
      filepath TEXT,
      password TEXT,
      max_views INTEGER DEFAULT 1,
      current_views INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_premium BOOLEAN DEFAULT 0
    );
    
    CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);
  `);
  
  return db;
}

// Share data interface
export interface Share {
  id: string;
  type: 'text' | 'file';
  content?: string;
  filename?: string;
  mimetype?: string;
  filepath?: string;
  password?: string;
  maxViews: number;
  currentViews: number;
  expiresAt?: Date;
  createdAt: Date;
  isPremium: boolean;
}
