import { sql } from '@vercel/postgres';

export interface Page {
  id: string;
  title: string;
  content: string;
  parent_id?: string;
  children: string[];
  created_at: Date;
  updated_at: Date;
  is_public?: boolean;
}

// Fonction pour initialiser la base de données (créer la table si elle n'existe pas)
export async function createPagesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        parent_id VARCHAR(255),
        children JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_public BOOLEAN DEFAULT FALSE
      );
    `;
    
    // Migration: Changer le type de content de JSONB vers TEXT si nécessaire
    try {
      await sql`
        ALTER TABLE pages
        ALTER COLUMN content TYPE TEXT
        USING CASE
          WHEN content IS NULL THEN NULL
          WHEN jsonb_typeof(content) = 'string' THEN content #>> '{}'
          ELSE content::text
        END;
      `;
      console.log('Column content migrated from JSONB to TEXT if needed.');
    } catch (migrationError) {
      // Si la migration échoue (par exemple, si la colonne est déjà TEXT), c'est normal
      console.log('Content column migration skipped (likely already TEXT):', (migrationError as Error).message);
    }
    
    console.log('Table "pages" created or already exists.');
  } catch (error) {
    console.error('Error creating "pages" table:', error);
    throw error;
  }
}