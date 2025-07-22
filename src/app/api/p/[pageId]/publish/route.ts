import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import type { Page } from '@/lib/database';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  // Le corps de la requête contiendra les données complètes de la page et le nouveau statut public
  const { pageData, isPublic }: { pageData: Page, isPublic: boolean } = await request.json();

  if (!pageData || isPublic === undefined) {
    return NextResponse.json({ error: 'Missing page data or public status.' }, { status: 400 });
  }

  // Valider que l'ID de la page correspond
  if (pageData.id !== pageId) {
    return NextResponse.json({ error: 'Page ID mismatch.' }, { status: 400 });
  }

  try {
    if (isPublic) {
      // Rendre la page publique : UPSERT (insérer ou mettre à jour) dans PostgreSQL
      await sql`
        INSERT INTO pages (id, title, content, is_public, created_at, updated_at)
        VALUES (
          ${pageData.id}, 
          ${pageData.title}, 
          ${pageData.content}, 
          TRUE, 
          ${new Date(pageData.createdAt).toISOString()}, 
          ${new Date(pageData.updatedAt).toISOString()}
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
          title = EXCLUDED.title, 
          content = EXCLUDED.content, 
          is_public = EXCLUDED.is_public, 
          updated_at = EXCLUDED.updated_at;
      `;
    } else {
      // Rendre la page privée : mettre à jour le statut dans PostgreSQL
      await sql`
        UPDATE pages 
        SET is_public = FALSE, updated_at = ${new Date().toISOString()}
        WHERE id = ${pageId};
      `;
    }
    // Répondre avec succès
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("API Error synchronizing page:", error);
    // Répondre en cas d'erreur serveur
    return NextResponse.json({ error: 'Failed to sync page data.' }, { status: 500 });
  }
} 