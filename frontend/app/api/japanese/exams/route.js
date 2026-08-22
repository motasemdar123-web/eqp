import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const customExamsFilePath = path.join(process.cwd(), 'lib', 'japanese', 'customExams.json');

function readCustomExams() {
  try {
    if (fs.existsSync(customExamsFilePath)) {
      const data = fs.readFileSync(customExamsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading customExams.json:', e);
  }
  return { N5: [], N4: [], N3: [] };
}

function writeCustomExams(exams) {
  try {
    const dir = path.dirname(customExamsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(customExamsFilePath, JSON.stringify(exams, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing customExams.json:', e);
  }
}

// GET /api/japanese/exams?level=N5
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    const customExams = readCustomExams();

    if (level) {
      return NextResponse.json({
        success: true,
        level,
        exams: customExams[level] || [],
      });
    }

    return NextResponse.json({
      success: true,
      customExams,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch custom exams', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/japanese/exams - Create or Update an exam paper
export async function POST(request) {
  try {
    const body = await request.json();
    const { level = 'N5', exam } = body;

    if (!exam || !exam.id) {
      return NextResponse.json(
        { error: 'Invalid exam payload: missing exam or exam.id' },
        { status: 400 }
      );
    }

    const customExams = readCustomExams();
    if (!customExams[level]) {
      customExams[level] = [];
    }

    const existingIdx = customExams[level].findIndex((e) => e.id === exam.id);
    if (existingIdx >= 0) {
      customExams[level][existingIdx] = exam;
    } else {
      customExams[level].push(exam);
    }

    writeCustomExams(customExams);

    return NextResponse.json({
      success: true,
      message: 'Exam saved successfully',
      exam,
      level,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save exam', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/japanese/exams?level=N5&id=exam-id
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'N5';
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing exam id' }, { status: 400 });
    }

    const customExams = readCustomExams();
    if (customExams[level]) {
      customExams[level] = customExams[level].filter((e) => e.id !== id);
      writeCustomExams(customExams);
    }

    return NextResponse.json({
      success: true,
      message: `Exam ${id} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete exam', details: error.message },
      { status: 500 }
    );
  }
}
