import { Page, AppSettings, LocalStorage } from '@/types';

const STORAGE_KEY = 'openrouter-notes';

const defaultSettings: AppSettings = {
  openrouterApiKey: '',
  defaultModel: 'openai/gpt-3.5-turbo',
};

const defaultStorage: LocalStorage = {
  pages: {},
  settings: defaultSettings,
  currentPageId: null,
};

export class StorageManager {
  private static instance: StorageManager;
  private storage: LocalStorage;

  private constructor() {
    this.storage = this.loadFromLocalStorage();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private loadFromLocalStorage(): LocalStorage {
    if (typeof window === 'undefined') {
      return defaultStorage;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir les dates string en objets Date
        if (parsed.pages) {
          Object.keys(parsed.pages).forEach(pageId => {
            const page = parsed.pages[pageId];
            if (page && typeof page.createdAt === 'string') {
              page.createdAt = new Date(page.createdAt);
            }
            if (page && typeof page.updatedAt === 'string') {
              page.updatedAt = new Date(page.updatedAt);
            }
          });
        }
        return { ...defaultStorage, ...parsed };
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
    }

    return defaultStorage;
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storage));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }

  // Gestion des paramètres
  public getSettings(): AppSettings {
    return this.storage.settings;
  }

  public updateSettings(settings: Partial<AppSettings>): void {
    this.storage.settings = { ...this.storage.settings, ...settings };
    this.saveToLocalStorage();
  }

  public isConfigured(): boolean {
    return Boolean(this.storage.settings.openrouterApiKey);
  }

  // Gestion des pages
  public getPages(): { [id: string]: Page } {
    return this.storage.pages;
  }

  public getPage(id: string): Page | null {
    return this.storage.pages[id] || null;
  }

  public createPage(title: string, parentId?: string): Page {
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

    this.storage.pages[id] = newPage;

    // Ajouter à la liste des enfants du parent
    if (parentId && this.storage.pages[parentId]) {
      this.storage.pages[parentId].children.push(id);
    }

    this.saveToLocalStorage();
    return newPage;
  }

  public updatePage(id: string, updates: Partial<Page>): Page | null {
    const page = this.storage.pages[id];
    if (!page) return null;

    const updatedPage = {
      ...page,
      ...updates,
      updatedAt: new Date(),
    };

    this.storage.pages[id] = updatedPage;
    this.saveToLocalStorage();
    return updatedPage;
  }

  public deletePage(id: string): boolean {
    const page = this.storage.pages[id];
    if (!page) return false;

    // Supprimer récursivement les sous-pages
    page.children.forEach(childId => {
      this.deletePage(childId);
    });

    // Retirer de la liste des enfants du parent
    if (page.parentId && this.storage.pages[page.parentId]) {
      this.storage.pages[page.parentId].children = 
        this.storage.pages[page.parentId].children.filter(childId => childId !== id);
    }

    // Supprimer la page
    delete this.storage.pages[id];

    // Si c'était la page courante, la réinitialiser
    if (this.storage.currentPageId === id) {
      this.storage.currentPageId = null;
    }

    this.saveToLocalStorage();
    return true;
  }

  public getRootPages(): Page[] {
    return Object.values(this.storage.pages)
      .filter(page => !page.parentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  public getChildren(parentId: string): Page[] {
    const parent = this.storage.pages[parentId];
    if (!parent) return [];

    return parent.children
      .map(childId => this.storage.pages[childId])
      .filter(Boolean)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Gestion de la page courante
  public getCurrentPageId(): string | null {
    return this.storage.currentPageId;
  }

  public setCurrentPage(id: string | null): void {
    this.storage.currentPageId = id;
    this.saveToLocalStorage();
  }

  // Utilitaires
  public exportData(): LocalStorage {
    return JSON.parse(JSON.stringify(this.storage));
  }

  public importData(data: LocalStorage): void {
    this.storage = { ...defaultStorage, ...data };
    this.saveToLocalStorage();
  }

  public clearAll(): void {
    this.storage = defaultStorage;
    this.saveToLocalStorage();
  }
}

export const storage = StorageManager.getInstance();