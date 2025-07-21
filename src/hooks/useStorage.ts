import { useState, useEffect } from 'react';
import { Page, AppSettings } from '@/types';
import { storage } from '@/lib/storage';

export function useStorage() {
  const [pages, setPages] = useState<{ [id: string]: Page }>({});
  const [settings, setSettings] = useState<AppSettings>({ openrouterApiKey: '', defaultModel: 'openai/gpt-3.5-turbo' });
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Charger les données initiales
    setPages(storage.getPages());
    setSettings(storage.getSettings());
    setCurrentPageId(storage.getCurrentPageId());
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    storage.updateSettings(newSettings);
    setSettings(storage.getSettings());
  };

  const createPage = (title: string, parentId?: string): Page => {
    const newPage = storage.createPage(title, parentId);
    setPages(storage.getPages());
    return newPage;
  };

  const updatePage = (id: string, updates: Partial<Page>): Page | null => {
    const updatedPage = storage.updatePage(id, updates);
    if (updatedPage) {
      setPages(storage.getPages());
    }
    return updatedPage;
  };

  const deletePage = (id: string): boolean => {
    const success = storage.deletePage(id);
    if (success) {
      setPages(storage.getPages());
      setCurrentPageId(storage.getCurrentPageId());
    }
    return success;
  };

  const setCurrentPage = (id: string | null) => {
    storage.setCurrentPage(id);
    setCurrentPageId(id);
  };

  const getRootPages = (): Page[] => {
    return storage.getRootPages();
  };

  const getChildren = (parentId: string): Page[] => {
    return storage.getChildren(parentId);
  };

  const isConfigured = (): boolean => {
    return settings.openrouterApiKey !== '';
  };

  return {
    // État
    pages,
    settings,
    currentPageId,
    isLoaded,
    
    // Actions
    updateSettings,
    createPage,
    updatePage,
    deletePage,
    setCurrentPage,
    
    // Utilitaires
    getRootPages,
    getChildren,
    isConfigured,
  };
}