import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'audio'; // 'audio' | 'image'

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No valid file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine target directory
    const targetDirName = type === 'image' ? 'images/japanese/uploads' : 'audio/japanese/uploads';
    const uploadDir = path.join(process.cwd(), 'public', targetDirName);

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitize filename
    const origName = file.name || (type === 'image' ? 'upload.png' : 'upload.mp3');
    const ext = path.extname(origName) || (type === 'image' ? '.png' : '.mp3');
    const baseName = path.basename(origName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFileName = `${baseName}_${Date.now()}${ext}`;

    const filePath = path.join(uploadDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/${targetDirName}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      size: buffer.length,
      type,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload', details: error.message },
      { status: 500 }
    );
  }
}
