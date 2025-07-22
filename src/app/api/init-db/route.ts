import { createPagesTable } from '@/lib/vercel-pg';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await createPagesTable();
    return NextResponse.json({ message: 'Database initialized successfully.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initialize database.' }, { status: 500 });
  }
} 