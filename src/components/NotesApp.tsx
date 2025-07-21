'use client';

import { useEffect } from 'react';
import { useNotesStore, useCurrentPage, useIsAIModalOpen, useAIModalContext } from '@/lib/store';
import Sidebar from './Sidebar';
import Editor from './Editor';
import AIModal from './AIModal';

export default function NotesApp() {
  const { createPage, openAIModal, closeAIModal, initialize } = useNotesStore();
  const currentPage = useCurrentPage();
  const isAIModalOpen = useIsAIModalOpen();
  const aiContext = useAIModalContext();

  // Initialiser le store au démarrage
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleCreateFirstPage = async () => {
    await createPage('New page');
  };

  const handleOpenAIModal = (context: {
    type: 'explain' | 'command';
    selectedText?: string;
    command?: string;
    position?: { x: number; y: number };
  }) => {
    openAIModal(context);
  };

  const handleCloseAIModal = () => {
    closeAIModal();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar onCreatePage={handleCreateFirstPage} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentPage ? (
          <Editor 
            page={currentPage}
            onOpenAIModal={handleOpenAIModal}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                No page selected
              </h2>
              <p className="text-gray-500 mb-4">
                Create a new page to get started
              </p>
              <button
                onClick={handleCreateFirstPage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create my first page
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Modal */}
      {isAIModalOpen && aiContext && (
        <AIModal
          context={aiContext}
          onClose={handleCloseAIModal}
          currentPageContent={currentPage?.content || ''}
        />
      )}
    </div>
  );
}