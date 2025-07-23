"use client";

import { useState, useEffect, useRef } from "react";

interface MobileSelectionMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onExplain: () => void;
  onCopy: () => void;
  onClose: () => void;
  onHighlight?: () => void;
  isLoading?: boolean;
}

export default function MobileSelectionMenu({
  isVisible,
  position,
  selectedText,
  onExplain,
  onCopy,
  onClose,
  onHighlight,
  isLoading = false,
}: MobileSelectionMenuProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let newX = position.x;
    let newY = position.y;

    // Ajuster horizontalement
    if (newX + rect.width > viewport.width - 20) {
      newX = viewport.width - rect.width - 20;
    }
    if (newX < 20) {
      newX = 20;
    }

    // Ajuster verticalement
    if (newY + rect.height > viewport.height - 20) {
      newY = position.y - rect.height - 40; // Placer au-dessus de la sélection
    }
    if (newY < 20) {
      newY = 20;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [isVisible, position]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      // Optionnel: afficher une notification de succès
      onCopy();
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      // Fallback pour les navigateurs qui ne supportent pas l'API clipboard
      const textArea = document.createElement("textarea");
      textArea.value = selectedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      onCopy();
    }
  };

  const getPreviewText = () => {
    if (selectedText.length <= 30) return selectedText;
    return selectedText.substring(0, 30) + "...";
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay pour fermer le menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onTouchStart={onClose}
      />

      {/* Menu de sélection */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          transform: "translateX(-50%)",
          minWidth: "280px",
          maxWidth: "320px",
        }}
      >
        {/* En-tête avec texte sélectionné */}
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <span className="text-sm text-blue-800 font-medium truncate">
              &ldquo;{getPreviewText()}&rdquo;
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-2">
          {/* Bouton Expliquer avec l'IA */}
          <button
            onClick={onExplain}
            disabled={isLoading}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              isLoading ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`font-medium ${isLoading ? "text-gray-500" : "text-gray-900"}`}
              >
                {isLoading ? "AI is thinking..." : "Explain with AI"}
              </div>
              <div className="text-xs text-gray-500">
                {isLoading ? "Please wait..." : "Get contextual explanation"}
              </div>
            </div>
          </button>

          {/* Bouton Copier */}
          <button
            onClick={handleCopy}
            disabled={isLoading}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              isLoading
                ? "bg-gray-100 cursor-not-allowed text-gray-400"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">Copy</div>
              <div className="text-xs text-gray-500">Copy to clipboard</div>
            </div>
          </button>

          {/* Bouton Surligner (optionnel) */}
          {onHighlight && (
            <button
              onClick={onHighlight}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7h10M9 11v6m6-6v6"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">Highlight</div>
                <div className="text-xs text-gray-500">Mark as important</div>
              </div>
            </button>
          )}
        </div>

        {/* Pied avec bouton fermer */}
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
