import { NextRequest, NextResponse } from 'next/server';
import { createShare } from '@/lib/shares';
import { initDb } from '@/lib/db';

// Initialize database on startup
initDb().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, password, expirationMode, maxViews, expirationTime } = body;
    
    if (!content || content.length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    const shareId = await createShare({
      type: 'text',
      content,
      password,
      expirationMode: expirationMode || 'views',
      maxViews: expirationMode === 'views' ? (maxViews || 1) : undefined,
      expirationTime: expirationMode === 'time' ? expirationTime : undefined,
      isPremium: false
    });
    
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/s/${shareId}`;
    
    return NextResponse.json({ 
      success: true,
      shareId,
      shareUrl
    });
  } catch (error) {
    console.error('Error creating text share:', error);
    return NextResponse.json({ 
      error: 'Failed to create share' 
    }, { status: 500 });
  }
}
