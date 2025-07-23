import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { addHours, addDays } from 'date-fns';
import { openDb } from './db';
import { promises as fs } from 'fs';
import path from 'path';

export interface CreateShareOptions {
  type: 'text' | 'file';
  content?: string;
  filename?: string;
  mimetype?: string;
  filepath?: string;
  password?: string;
  expirationMode: 'views' | 'time';
  maxViews?: number;
  expirationTime?: string;
  isPremium?: boolean;
}

export async function createShare(options: CreateShareOptions) {
  const db = await openDb();
  const id = nanoid(10);
  
  let expiresAt: Date | null = null;
  let maxViews = 1;
  
  if (options.expirationMode === 'time') {
    const now = new Date();
    switch (options.expirationTime) {
      case '1hour':
        expiresAt = addHours(now, 1);
        break;
      case '24hours':
        expiresAt = addHours(now, 24);
        break;
      case '7days':
        expiresAt = addDays(now, 7);
        break;
      case '30days':
        expiresAt = addDays(now, 30);
        break;
      default:
        if (options.expirationTime && options.expirationTime.includes('hours')) {
          const hours = parseInt(options.expirationTime);
          expiresAt = addHours(now, hours);
        } else {
          expiresAt = addHours(now, 24);
        }
        break;
    }
    maxViews = 999999; // Effectively unlimited for time-based expiration
  } else {
    maxViews = options.maxViews || 1;
  }
  
  const hashedPassword = options.password 
    ? await bcrypt.hash(options.password, 10)
    : null;
  
  await db.run(
    `INSERT INTO shares (
      id, type, content, filename, mimetype, filepath, 
      password, max_views, expires_at, is_premium
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      options.type,
      options.content,
      options.filename,
      options.mimetype,
      options.filepath,
      hashedPassword,
      maxViews,
      expiresAt?.toISOString() || null,
      options.isPremium ? 1 : 0
    ]
  );
  
  return id;
}

export async function getShare(id: string, password?: string) {
  const db = await openDb();
  
  const share = await db.get(
    `SELECT * FROM shares WHERE id = ?`,
    [id]
  );
  
  if (!share) {
    return null;
  }
  
  // Check if expired by time
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    await deleteShare(id);
    return null;
  }
  
  // Check if expired by views
  if (share.current_views >= share.max_views) {
    await deleteShare(id);
    return null;
  }
  
  // Check password if required
  if (share.password) {
    if (!password || !(await bcrypt.compare(password, share.password))) {
      return { requiresPassword: true };
    }
  }
  
  // Increment view count
  await db.run(
    `UPDATE shares SET current_views = current_views + 1 WHERE id = ?`,
    [id]
  );
  
  // Check if this was the last allowed view
  const updatedShare = await db.get(
    `SELECT * FROM shares WHERE id = ?`,
    [id]
  );
  
  if (updatedShare.current_views >= updatedShare.max_views) {
    // Schedule deletion after response is sent
    setTimeout(() => deleteShare(id), 1000);
  }
  
  return {
    id: share.id,
    type: share.type,
    content: share.content,
    filename: share.filename,
    mimetype: share.mimetype,
    filepath: share.filepath,
    isLastView: updatedShare.current_views >= updatedShare.max_views,
    viewsRemaining: Math.max(0, updatedShare.max_views - updatedShare.current_views)
  };
}

export async function deleteShare(id: string) {
  const db = await openDb();
  
  // Get share info first
  const share = await db.get(
    `SELECT filepath FROM shares WHERE id = ?`,
    [id]
  );
  
  // Delete from database
  await db.run(`DELETE FROM shares WHERE id = ?`, [id]);
  
  // Delete file if it exists
  if (share?.filepath) {
    try {
      await fs.unlink(share.filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}

// Cleanup expired shares (run periodically)
export async function cleanupExpiredShares() {
  const db = await openDb();
  
  // Get all expired shares
  const expiredShares = await db.all(
    `SELECT id, filepath FROM shares 
     WHERE (expires_at IS NOT NULL AND expires_at < datetime('now'))
     OR current_views >= max_views`
  );
  
  // Delete each expired share
  for (const share of expiredShares) {
    await deleteShare(share.id);
  }
  
  return expiredShares.length;
}
