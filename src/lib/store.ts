import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { DatabaseService } from './database';
import { DEFAULT_MODEL_ID } from './openrouter';
import type { Page, AppSettings } from './database';

export interface NotesState {
  // État des pages
  pages: Record<string, Page>;
  currentPageId: string | null;
  isLoading: boolean;
  
  // État des paramètres
  settings: AppSettings;
  isConfigured: boolean;
  
  // État de l'interface
  expandedPages: Set<string>;
  selectedText: string | null;
  isAIModalOpen: boolean;
  aiContext: {
    type: 'explain' | 'command';
    selectedText?: string;
    command?: string;
    position?: { x: number; y: number };
  } | null;
}

export interface NotesActions {
  // Actions des pages
  loadPages: () => Promise<void>;
  createPage: (title: string, parentId?: string) => Promise<Page>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<boolean>;
  deletePage: (id: string) => Promise<void>;
  setCurrentPage: (id: string | null) => Promise<void>;
  
  // Actions des paramètres
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  
  // Actions de l'interface
  toggleExpandedPage: (pageId: string) => void;
  setSelectedText: (text: string | null) => void;
  openAIModal: (context: NotesState['aiContext']) => void;
  closeAIModal: () => void;
  
  // Sélecteurs optimisés
  getRootPages: () => Page[];
  getChildren: (parentId: string) => Page[];
  getCurrentPage: () => Page | null;
  
  // Utilitaires
  initialize: () => Promise<void>;
  reset: () => Promise<void>;
}

type NotesStore = NotesState & NotesActions;

export const useNotesStore = create<NotesStore>()(
  subscribeWithSelector<NotesStore>((set, get) => ({
    // État initial
    pages: {},
    currentPageId: null,
    isLoading: false,
    settings: {
      openrouterApiKey: '',
      defaultModel: 'DEFAULT_MODEL_ID',
      currentPageId: null
    },
    isConfigured: false,
    expandedPages: new Set<string>(),
    selectedText: null,
    isAIModalOpen: false,
    aiContext: null,

    // Actions des pages
    loadPages: async () => {
      set({ isLoading: true });
      try {
        const pages = await DatabaseService.getAllPages();
        const pagesMap = pages.reduce((acc, page) => {
          acc[page.id] = page;
          return acc;
        }, {} as Record<string, Page>);
        
        set({ pages: pagesMap });
      } catch (error) {
        console.error('Erreur lors du chargement des pages:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    createPage: async (title: string, parentId?: string) => {
      const newPage = await DatabaseService.createPage(title, parentId);
      
      set((state) => ({
        pages: { ...state.pages, [newPage.id]: newPage },
        currentPageId: newPage.id, // Nouvelle page sélectionnée automatiquement
        expandedPages: parentId 
          ? new Set([...state.expandedPages, parentId])
          : state.expandedPages
      }));
      
      // Mettre à jour la page courante dans la base
      await DatabaseService.setCurrentPageId(newPage.id);
      
      // Mettre à jour le parent si nécessaire
      if (parentId && get().pages[parentId]) {
        const parent = get().pages[parentId];
        const updatedParent = { ...parent, children: [...parent.children, newPage.id] };
        set((state) => ({
          pages: { ...state.pages, [parentId]: updatedParent }
        }));
      }
      
      return newPage;
    },

    updatePage: async (id: string, updates: Partial<Page>): Promise<boolean> => {
      // 1. Mettre à jour la base de données locale (optimiste)
      const pageToUpdate = get().pages[id];
      if (!pageToUpdate) return false;

      const updatedPage = { ...pageToUpdate, ...updates, updatedAt: new Date() };

      await DatabaseService.updatePage(id, updates);
      
      set((state) => ({
        pages: { ...state.pages, [id]: updatedPage }
      }));

      // 2. Synchroniser avec le serveur si le statut public change
      if (updates.isPublic !== undefined) {
        try {
          const response = await fetch(`/api/p/${id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageData: updatedPage, isPublic: updates.isPublic }),
          });

          if (!response.ok) {
            throw new Error('Server synchronization failed');
          }
          return true; // Succès
        } catch (error) {
          console.error("Erreur lors de l'appel à l'API de publication:", error);
          // Annuler la modification locale en cas d'échec de la synchronisation
          await DatabaseService.updatePage(id, { isPublic: pageToUpdate.isPublic });
          set((state) => ({
            pages: { ...state.pages, [id]: pageToUpdate }
          }));
          return false; // Échec
        }
      }
      
      return true; // Succès si pas de changement de statut public
    },

    deletePage: async (id: string) => {
      const success = await DatabaseService.deletePage(id);
      if (success) {
        const state = get();
        const newPages = { ...state.pages };
        
        // Supprimer récursivement toutes les pages enfants
        const deleteRecursively = (pageId: string) => {
          const page = newPages[pageId];
          if (page) {
            page.children.forEach(deleteRecursively);
            delete newPages[pageId];
          }
        };
        
        deleteRecursively(id);
        
        // Si la page supprimée était la page courante, sélectionner une autre page
        let newCurrentPageId = state.currentPageId;
        if (state.currentPageId === id) {
          const remainingPages = Object.values(newPages);
          newCurrentPageId = remainingPages.length > 0 ? remainingPages[0].id : null;
          await DatabaseService.setCurrentPageId(newCurrentPageId);
        }
        
        set({
          pages: newPages,
          currentPageId: newCurrentPageId
        });
      }
    },

    setCurrentPage: async (id: string | null) => {
      set({ currentPageId: id });
      await DatabaseService.setCurrentPageId(id);
    },

    // Actions des paramètres
    loadSettings: async () => {
      try {
        const settings = await DatabaseService.getSettings();
        const currentPageId = await DatabaseService.getCurrentPageId();
        
        set({
          settings,
          currentPageId,
          isConfigured: Boolean(settings.openrouterApiKey)
        });
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        
        // En cas d'erreur avec IndexedDB, utiliser des paramètres par défaut
        set({
          settings: {
            openrouterApiKey: '',
            defaultModel: 'DEFAULT_MODEL_ID',
            currentPageId: null,
            customModels: []
          },
          isConfigured: false
        });
      }
    },

    updateSettings: async (updates: Partial<AppSettings>) => {
      try {
        await DatabaseService.updateSettings(updates);
        const newSettings = await DatabaseService.getSettings();
        
        set({
          settings: newSettings,
          isConfigured: Boolean(newSettings.openrouterApiKey)
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error);
        
        // En cas d'erreur avec IndexedDB, mettre à jour l'état local seulement
        const currentSettings = get().settings;
        const newSettings = { ...currentSettings, ...updates };
        
        set({
          settings: newSettings,
          isConfigured: Boolean(newSettings.openrouterApiKey)
        });
      }
    },

    // Actions de l'interface
    toggleExpandedPage: (pageId: string) => {
      set((state) => {
        const newExpanded = new Set(state.expandedPages);
        if (newExpanded.has(pageId)) {
          newExpanded.delete(pageId);
        } else {
          newExpanded.add(pageId);
        }
        return { expandedPages: newExpanded };
      });
    },

    setSelectedText: (text: string | null) => {
      set({ selectedText: text });
    },

    openAIModal: (context) => {
      set({ isAIModalOpen: true, aiContext: context });
    },

    closeAIModal: () => {
      set({ isAIModalOpen: false, aiContext: null });
    },

    // Sélecteurs optimisés
    getRootPages: () => {
      const state = get();
      return Object.values(state.pages)
        .filter(page => !page.parentId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    getChildren: (parentId: string) => {
      const state = get();
      return Object.values(state.pages)
        .filter(page => page.parentId === parentId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    getCurrentPage: () => {
      const state = get();
      return state.currentPageId ? state.pages[state.currentPageId] || null : null;
    },

    // Utilitaires
    initialize: async () => {
      await Promise.all([
        get().loadSettings(),
        get().loadPages()
      ]);
    },

    reset: async () => {
      await DatabaseService.clearAll();
      set({
        pages: {},
        currentPageId: null,
        settings: {
          openrouterApiKey: '',
          defaultModel: 'DEFAULT_MODEL_ID',
          currentPageId: null
        },
        isConfigured: false,
        expandedPages: new Set(),
        selectedText: null,
        isAIModalOpen: false,
        aiContext: null
      });
    }
  }))
);

// Sélecteurs optimisés pour la performance
export const useCurrentPage = () => useNotesStore((state) =>
  state.currentPageId ? state.pages[state.currentPageId] || null : null
);

export const useRootPages = () => useNotesStore((state) => state.pages);

export const usePageChildren = () => useNotesStore((state) => state.pages);

export const useIsConfigured = () => useNotesStore((state) => state.isConfigured);
export const useSettings = () => useNotesStore((state) => state.settings);

// Sélecteurs séparés pour éviter les re-renders inutiles
export const useIsAIModalOpen = () => useNotesStore((state) => state.isAIModalOpen);
export const useAIModalContext = () => useNotesStore((state) => state.aiContext);