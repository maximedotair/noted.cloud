"use client";

import { useEffect, useState } from "react";
import {
  useNotesStore,
  useCurrentPage,
  useSettings,
} from "@/lib/store";
import Sidebar from "./Sidebar";
import Editor from "./Editor";

export default function NotesApp() {
  const { createPage, initialize } = useNotesStore();
  const currentPage = useCurrentPage();
  const settings = useSettings();

  // État pour la sidebar mobile
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initialiser le store au démarrage
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fermer la sidebar mobile quand on change de page
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [currentPage?.id, isMobile]);

  // Empêcher le scroll du body quand la sidebar mobile est ouverte
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, isMobileSidebarOpen]);

  const handleCreateFirstPage = async () => {
    await createPage("New page");
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Overlay pour mobile */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar - Desktop toujours visible, Mobile avec animation */}
      <div
        className={`
        ${
          isMobile
            ? `fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative"
        }
      `}
      >
        <Sidebar
          onCreatePage={handleCreateFirstPage}
          isMobile={isMobile}
          onClose={closeMobileSidebar}
          isCollapsed={!isMobile ? isSidebarCollapsed : false}
          onToggleCollapse={!isMobile ? toggleSidebarCollapse : undefined}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile avec bouton hamburger */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
            <button
              onClick={toggleMobileSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentPage?.title || "Noted.cloud"}
            </h1>
            <div className="w-10" /> {/* Spacer pour centrer le titre */}
          </div>
        )}

        {currentPage ? (
          <Editor
            page={currentPage}
            apiKey={settings.openrouterApiKey}
            model={settings.defaultModel}
            isMobile={isMobile}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
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
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Create my first page
              </button>

              {isMobile && (
                <div className="mt-4 text-xs text-gray-400">
                  Or use the ☰ menu to navigate
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
