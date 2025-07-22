import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  try {
    const { rows } = await sql`
      SELECT id, title, content, updated_at 
      FROM pages 
      WHERE id = ${pageId} AND is_public = TRUE;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Page not found or is not public.' }, { status: 404 });
    }

    // Le contenu est déjà correctement formaté par le driver de la DB (TEXT -> string)
    const page = rows[0];

    return NextResponse.json(page, { status: 200 });
  } catch (error) {
    console.error('API Error fetching page:', error);
    return NextResponse.json({ error: 'Failed to fetch page data.' }, { status: 500 });
  }
} 