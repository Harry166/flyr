import { NextRequest, NextResponse } from 'next/server';
import { getShare } from '@/lib/shares';

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
    
    if (share.type === 'text') {
      return NextResponse.json({
        type: 'text',
        content: share.content,
        isLastView: share.isLastView,
        viewsRemaining: share.viewsRemaining
      });
    } else if (share.type === 'file' && share.filepath) {
      // For file shares, return metadata
      // The actual file download will be handled by a separate endpoint
      return NextResponse.json({
        type: 'file',
        filename: share.filename,
        mimetype: share.mimetype,
        isLastView: share.isLastView,
        viewsRemaining: share.viewsRemaining,
        downloadUrl: `/api/shares/${id}/download`
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid share type' 
    }, { status: 400 });
  } catch (error) {
    console.error('Error retrieving share:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve share' 
    }, { status: 500 });
  }
}
