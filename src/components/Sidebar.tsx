'use client';

import { useState } from 'react';
import { useNotesStore, useRootPages, useSettings } from '@/lib/store';
import type { Page } from '@/lib/database';

interface SidebarProps {
  onCreatePage: () => void;
}

export default function Sidebar({ onCreatePage }: SidebarProps) {
  const {
    pages,
    currentPageId,
    createPage,
    deletePage,
    setCurrentPage,
    updateSettings,
    toggleExpandedPage,
    expandedPages
  } = useNotesStore();
  
  const allPages = useRootPages();
  const settings = useSettings();

  // Extraire les pages racines depuis l'objet pages
  const rootPages = Object.values(allPages)
    .filter(page => !page.parentId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const handleCreateSubPage = async (parentId: string) => {
    const parentPage = pages[parentId];
    await createPage(`Sub-page of ${parentPage?.title || 'Page'}`, parentId);
    // L'expansion de la page parent et la sélection de la nouvelle page sont gérées dans le store
  };

  const handleDeletePage = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this page and all its sub-pages?')) {
      await deletePage(pageId);
    }
  };

  const getPageChildren = (pageId: string) => {
    return Object.values(pages)
      .filter(page => page.parentId === pageId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  };

  const renderPage = (page: Page, level: number = 0) => {
    const children = getPageChildren(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedPages.has(page.id);
    const isActive = currentPageId === page.id;

    return (
      <div key={page.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group hover:bg-gray-100 ${
            isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => setCurrentPage(page.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandedPage(page.id);
              }}
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          {!hasChildren && <div className="w-4" />}
          
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          
          <span className="flex-1 text-sm text-gray-700 truncate">
            {page.title || 'Untitled'}
          </span>
          
          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateSubPage(page.id);
              }}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded text-gray-500"
              title="Create sub-page"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={(e) => handleDeletePage(page.id, e)}
              className="w-6 h-6 flex items-center justify-center hover:bg-red-100 rounded text-red-500"
              title="Delete page"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderPage(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">OpenRouter Notes</h1>
        
        </div>
        
        
        
        <button
          onClick={onCreatePage}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Page
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2">
        {rootPages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No pages yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {rootPages.map(page => renderPage(page))}
          </div>
        )}
      </div>
    </div>
  );
}