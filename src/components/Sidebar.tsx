"use client";

import { useState } from "react";
import { useNotesStore, useRootPages, useSettings } from "@/lib/store";
import type { Page } from "@/lib/database";

interface SidebarProps {
  onCreatePage: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  onCreatePage,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const {
    pages,
    currentPageId,
    createPage,
    deletePage,
    setCurrentPage,
    updateSettings,
    toggleExpandedPage,
    expandedPages,
  } = useNotesStore();

  const allPages = useRootPages();
  const settings = useSettings();

  // Extraire les pages racines depuis l'objet pages
  const rootPages = Object.values(allPages)
    .filter((page) => !page.parentId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const handleCreateSubPage = async (parentId: string) => {
    const parentPage = pages[parentId];
    await createPage(`Sub-page of ${parentPage?.title || "Page"}`, parentId);
    // L'expansion de la page parent et la sélection de la nouvelle page sont gérées dans le store
  };

  const handleDeletePage = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this page and all its sub-pages?",
      )
    ) {
      await deletePage(pageId);
    }
  };

  const handlePageSelect = (pageId: string) => {
    setCurrentPage(pageId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleCreatePage = () => {
    onCreatePage();
    if (isMobile && onClose) {
      onClose();
    }
  };

  const getPageChildren = (pageId: string) => {
    return Object.values(pages)
      .filter((page) => page.parentId === pageId)
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
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer group hover:bg-gray-100 transition-colors ${
            isActive ? "bg-blue-50 border-r-2 border-blue-500" : ""
          } ${isMobile ? "py-3" : ""}`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => handlePageSelect(page.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandedPage(page.id);
              }}
              className={`w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded transition-colors ${
                isMobile ? "w-6 h-6" : ""
              }`}
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""} ${
                  isMobile ? "w-4 h-4" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {!hasChildren && <div className={`${isMobile ? "w-6" : "w-5"}`} />}

          <svg
            className={`w-4 h-4 text-gray-400 ${isMobile ? "w-5 h-5" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>

          <span
            className={`flex-1 text-gray-700 truncate ${isMobile ? "text-base" : "text-sm"}`}
          >
            {page.title || "Untitled"}
          </span>

          <div
            className={`opacity-0 group-hover:opacity-100 flex gap-1 ${isMobile ? "opacity-100" : ""}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateSubPage(page.id);
              }}
              className={`flex items-center justify-center hover:bg-gray-200 rounded text-gray-500 transition-colors ${
                isMobile ? "w-8 h-8" : "w-6 h-6"
              }`}
              title="Create sub-page"
            >
              <svg
                className={`${isMobile ? "w-4 h-4" : "w-3 h-3"}`}
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
            </button>
            <button
              onClick={(e) => handleDeletePage(page.id, e)}
              className={`flex items-center justify-center hover:bg-red-100 rounded text-red-500 transition-colors ${
                isMobile ? "w-8 h-8" : "w-6 h-6"
              }`}
              title="Delete page"
            >
              <svg
                className={`${isMobile ? "w-4 h-4" : "w-3 h-3"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderPage(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-full ${
        isMobile ? "w-80 shadow-xl" : "w-80"
      }`}
    >
      {/* Header */}
      <div className={`border-b border-gray-200 ${isMobile ? "p-6" : "p-4"}`}>
        <div className="flex items-center justify-between mb-4">
          <h1
            className={`font-semibold text-gray-900 ${isMobile ? "text-xl" : "text-lg"}`}
          >
            Noted.cloud
          </h1>

          {/* Bouton de fermeture pour mobile */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={handleCreatePage}
          className={`w-full flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
            isMobile ? "px-4 py-3 text-base" : "px-3 py-2 text-sm"
          }`}
        >
          <svg
            className={`${isMobile ? "w-5 h-5" : "w-4 h-4"}`}
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
          New Page
        </button>
      </div>

      {/* Pages List */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? "p-3" : "p-2"}`}>
        {rootPages.length === 0 ? (
          <div
            className={`text-center text-gray-500 ${isMobile ? "py-12" : "py-8"}`}
          >
            <div className={`${isMobile ? "mb-4" : "mb-2"}`}>
              <svg
                className={`mx-auto text-gray-300 ${isMobile ? "w-12 h-12" : "w-8 h-8"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className={`${isMobile ? "text-base" : "text-sm"}`}>
              No pages yet
            </p>
            <p
              className={`text-xs text-gray-400 mt-1 ${isMobile ? "text-sm" : ""}`}
            >
              Create your first page
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {rootPages.map((page) => renderPage(page))}
          </div>
        )}
      </div>

      {/* Footer - Masqué sur mobile pour économiser l'espace */}
      {!isMobile && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-4 text-center">
            <a
              href="https://www.producthunt.com/products/noted-cloud?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-noted&#0045;cloud"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=996188&theme=light&t=1753193235000"
                alt="Noted.cloud - Bring Contextual AI Explanations to Any Note | Product Hunt"
                style={{ width: "250px", height: "54px" }}
                width="250"
                height="54"
              />
            </a>
          </div>
          <div className="text-xs text-gray-600">
            <p className="mb-1">
              Beta version with persistent storage via your browser.
              Account/email backup coming soon for robustness.
            </p>
            <a
              href="https://github.com/maximedotair/noted.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      )}

      {/* Footer mobile simplifié */}
      {isMobile && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">
              Noted.cloud - Beta Version
            </div>
            <a
              href="https://github.com/maximedotair/noted.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
