import { NextRequest, NextResponse } from 'next/server';
import { createShare } from '@/lib/shares';
import { initDb } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

// Initialize database on startup
initDb().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;
    const expirationMode = (formData.get('expirationMode') as string) as 'views' | 'time';
    const maxViews = parseInt(formData.get('maxViews') as string) || 1;
    const expirationTime = formData.get('expirationTime') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    // File size limit: 5GB for all users
    if (file.size > 5 * 1024 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size exceeds 5GB limit' 
      }, { status: 400 });
    }
    
    // Save file to disk
    const uploadsDir = process.env.RENDER
      ? path.join('/var/data', 'uploads')
      : path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const fileId = nanoid();
    const ext = path.extname(file.name);
    const filename = `${fileId}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filepath, buffer);
    
    // Create share record
    const shareId = await createShare({
      type: 'file',
      filename: file.name,
      mimetype: file.type,
      filepath: filepath,
      password,
      expirationMode: expirationMode || 'views',
      maxViews: expirationMode === 'views' ? maxViews : undefined,
      expirationTime: expirationMode === 'time' ? expirationTime : undefined,
      isPremium: false
    });
    
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/s/${shareId}`;
    
    return NextResponse.json({ 
      success: true,
      shareId,
      shareUrl
    });
    } catch (err) {
    console.error('Error creating file share:', err);
    return NextResponse.json({ 
      error: 'Failed to create share' 
    }, { status: 500 });
  }
}
