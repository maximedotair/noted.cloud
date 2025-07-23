"use client";

import { useState, useEffect } from "react";
import type { Page } from "@/lib/database";
import { useNotesStore } from "@/lib/store";

interface ShareModalProps {
  page: Page;
  onClose: () => void;
  isMobile?: boolean;
}

export default function ShareModal({
  page,
  onClose,
  isMobile = false,
}: ShareModalProps) {
  const { updatePage } = useNotesStore();
  const [isPublic, setIsPublic] = useState(page.isPublic || false);
  const [publicUrl, setPublicUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // S'assurer que le code ne s'exécute que côté client où `window` est disponible
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/p/${page.id}`;
      setPublicUrl(url);
    }
  }, [page.id]);

  const handleTogglePublic = async (checked: boolean) => {
    setIsSyncing(true);
    setError(null);

    const success = await updatePage(page.id, { isPublic: checked });

    setIsSyncing(false);

    if (success) {
      setIsPublic(checked);
    } else {
      setError("Failed to sync with the server. Please try again.");
      // Le store gère déjà le retour en arrière, mais on s'assure que l'UI est cohérente
      setIsPublic(!checked);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Share this page</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
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
        </div>

        <p className={`text-gray-600 mb-4 ${isMobile ? "text-sm" : "text-sm"}`}>
          Anyone with the link can view this page.
        </p>

        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-4">
          <span className="text-sm text-gray-700 font-medium">
            Make page public
          </span>
          <div className="flex items-center">
            {isSyncing && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => handleTogglePublic(e.target.checked)}
                className="sr-only peer"
                disabled={isSyncing}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {error && (
          <div className="text-center p-2 mb-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isPublic && !isSyncing && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your page is now public. Share the link below:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                disabled={isSyncing}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {!isPublic && (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              This page is private. Enable sharing to get a public link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
