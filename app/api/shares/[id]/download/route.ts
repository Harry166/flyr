import { NextRequest, NextResponse } from 'next/server';
import { getShare } from '@/lib/shares';
import { promises as fs } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const password = request.headers.get('x-share-password') || undefined;
    
    const share = await getShare(id, password);
    
    if (!share) {
      return NextResponse.json({ 
        error: 'Share not found or has expired' 
      }, { status: 404 });
    }
    
    if ('requiresPassword' in share) {
      return NextResponse.json({ 
        requiresPassword: true 
      }, { status: 401 });
    }
    
    if (share.type !== 'file' || !share.filepath) {
      return NextResponse.json({ 
        error: 'This share is not a file' 
      }, { status: 400 });
    }
    
    try {
      const fileBuffer = await fs.readFile(share.filepath);
      
      const headers = new Headers();
      headers.set('Content-Type', share.mimetype || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${share.filename}"`);
      headers.set('Content-Length', fileBuffer.length.toString());
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json({ 
        error: 'File not found' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ 
      error: 'Failed to download file' 
    }, { status: 500 });
  }
}
