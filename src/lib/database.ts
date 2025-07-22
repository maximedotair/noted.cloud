import Dexie, { Table } from 'dexie';
import { DEFAULT_MODEL_ID } from './openrouter';

export interface Page {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  children: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  id?: number;
  openrouterApiKey: string;
  defaultModel: string;
  currentPageId?: string | null;
  customModels?: string[]; // Liste des modèles personnalisés ajoutés
  aiAssistantEnabled?: boolean; // Activer/désactiver l'assistant AI
  defaultLanguage?: string; // Langue par défaut pour les prompts AI (ISO 639-1)
}

export class NotesDatabase extends Dexie {
  pages!: Table<Page, string>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('OpenRouterNotesDB');
    
    this.version(1).stores({
      pages: 'id, title, parentId, createdAt, updatedAt',
      settings: '++id, openrouterApiKey, defaultModel, currentPageId'
    });
  }
}

export const db = new NotesDatabase();

// Service de base de données avec méthodes utilitaires
export class DatabaseService {
  // Pages
  static async getAllPages(): Promise<Page[]> {
    return await db.pages.orderBy('createdAt').toArray();
  }

  static async getPage(id: string): Promise<Page | undefined> {
    return await db.pages.get(id);
  }

  static async createPage(title: string, parentId?: string): Promise<Page> {
    const id = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newPage: Page = {
      id,
      title,
      content: '',
      parentId,
      children: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.pages.add(newPage);
    
    // Ajouter à la liste des enfants du parent
    if (parentId) {
      const parent = await db.pages.get(parentId);
      if (parent) {
        parent.children.push(id);
        await db.pages.update(parentId, { children: parent.children });
      }
    }

    return newPage;
  }

  static async updatePage(id: string, updates: Partial<Page>): Promise<Page | null> {
    const page = await db.pages.get(id);
    if (!page) return null;

    const updatedPage = {
      ...page,
      ...updates,
      updatedAt: new Date(),
    };

    await db.pages.update(id, updatedPage);
    return updatedPage;
  }

  static async deletePage(id: string): Promise<boolean> {
    const page = await db.pages.get(id);
    if (!page) return false;

    // Supprimer récursivement les sous-pages
    for (const childId of page.children) {
      await this.deletePage(childId);
    }

    // Retirer de la liste des enfants du parent
    if (page.parentId) {
      const parent = await db.pages.get(page.parentId);
      if (parent) {
        parent.children = parent.children.filter(childId => childId !== id);
        await db.pages.update(page.parentId, { children: parent.children });
      }
    }

    // Supprimer la page
    await db.pages.delete(id);
    return true;
  }

  static async getRootPages(): Promise<Page[]> {
    const allPages = await db.pages.orderBy('createdAt').toArray();
    return allPages.filter(page => !page.parentId);
  }

  static async getChildren(parentId: string): Promise<Page[]> {
    return await db.pages
      .where('parentId')
      .equals(parentId)
      .sortBy('createdAt');
  }

  // Settings
  static async getSettings(): Promise<AppSettings> {
    const settings = await db.settings.orderBy('id').first();
    return settings || {
      openrouterApiKey: '',
      defaultModel: 'DEFAULT_MODEL_ID',
      currentPageId: null,
      customModels: [],
      aiAssistantEnabled: true,
      defaultLanguage: 'en'
    };
  }

  static async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const settings = await this.getSettings();
    
    if (settings.id) {
      await db.settings.update(settings.id, updates);
    } else {
      await db.settings.add({ ...settings, ...updates });
    }
  }

  static async getCurrentPageId(): Promise<string | null> {
    const settings = await this.getSettings();
    return settings.currentPageId || null;
  }

  static async setCurrentPageId(pageId: string | null): Promise<void> {
    await this.updateSettings({ currentPageId: pageId });
  }

  // Utilitaires
  static async exportData(): Promise<{ pages: Page[], settings: AppSettings }> {
    const pages = await this.getAllPages();
    const settings = await this.getSettings();
    return { pages, settings };
  }

  static async importData(data: { pages: Page[], settings: AppSettings }): Promise<void> {
    await db.transaction('rw', db.pages, db.settings, async () => {
      await db.pages.clear();
      await db.settings.clear();
      
      await db.pages.bulkAdd(data.pages);
      await db.settings.add(data.settings);
    });
  }

  static async clearAll(): Promise<void> {
    await db.transaction('rw', db.pages, db.settings, async () => {
      await db.pages.clear();
      await db.settings.clear();
    });
  }
}