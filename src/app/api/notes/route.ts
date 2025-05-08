import { put, list, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { note, action } = await request.json();
    
    if (action === 'save') {
      // Save note to Blob Storage
      const blob = await put(`notes/${note.id}.json`, JSON.stringify(note), {
        access: 'public',
      });
      
      return NextResponse.json({ success: true, url: blob.url });
    } 
    else if (action === 'delete') {
      // Delete note from Blob Storage
      await del(`notes/${note.id}.json`);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    // List all notes from Blob Storage
    const { blobs } = await list({ prefix: 'notes/' });
    
    // Fetch and parse all note content
    const notesPromises = blobs.map(async (blob) => {
      const response = await fetch(blob.url);
      const noteData = await response.json();
      return noteData;
    });
    
    const notes = await Promise.all(notesPromises);
    
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
} 