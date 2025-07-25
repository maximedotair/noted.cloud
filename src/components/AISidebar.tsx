"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OpenRouterAPI, DEFAULT_MODELS } from "@/lib/openrouter";
import { useNotesStore } from "@/lib/store";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import AISettingsModal from "./AISettingsModal";

interface AISidebarProps {
  selectionContext: { text: string; start: number; end: number } | null;
  fullContent: string;
  apiKey: string;
  model: string;
  isMobile?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onAddToNote?: () => void;
}

export default function AISidebar({
  selectionContext,
  fullContent,
  apiKey,
  model,
  isMobile = false,
  isVisible = true,
  onToggleVisibility,
  onAddToNote,
}: AISidebarProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [currentModel, setCurrentModel] = useState(model);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [shouldGenerateExplanation, setShouldGenerateExplanation] = useState(false);
  const [isWaitingForSelection, setIsWaitingForSelection] = useState(false);
  const { updateSettings, settings } = useNotesStore();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateExplanation = useCallback(async () => {
    if (!selectionContext || !settings.aiAssistantEnabled) return;

    // Limiter la sélection à 10 mots
    const wordCount = selectionContext.text.trim().split(/\s+/).length;
    if (wordCount > 10) {
      setError("Please select 10 words or less for the AI assistant.");
      setResponse("");
      return;
    }

    if (!apiKey || !apiKey.trim()) {
      setError("No API key configured. Please check your settings.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const api = new OpenRouterAPI(apiKey);

      // Construire le contexte
      const selectedModelInfo = DEFAULT_MODELS.find((m) => m.id === model) || {
        context_length: 4096,
      };
      const maxContext = selectedModelInfo.context_length;

      let contextText = selectionContext.text;
      const remainingChars = maxContext - contextText.length;

      if (remainingChars > 0 && selectionContext.start > 0) {
        const charsBefore = Math.floor(remainingChars / 2);
        const charsAfter = remainingChars - charsBefore;

        const textBefore = fullContent.substring(
          Math.max(0, selectionContext.start - charsBefore),
          selectionContext.start,
        );
        const textAfter = fullContent.substring(
          selectionContext.end,
          Math.min(fullContent.length, selectionContext.end + charsAfter),
        );

        contextText = `${textBefore}>>${selectionContext.text}<<${textAfter}`;
      }

      const result = await api.explainSelection(
        contextText,
        "User is taking notes and wants an explanation of the selected text (marked with >>...<<). Focus on the marked text.",
        model,
        settings.defaultLanguage,
      );

      if (result.content) {
        setResponse(result.content);
        setCurrentModel(model);
      } else {
        setError("No response received");
      }
    } catch (err) {
      console.error("Error calling OpenRouter:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [
    selectionContext,
    fullContent,
    apiKey,
    model,
    settings.aiAssistantEnabled,
    settings.defaultLanguage,
  ]);

  // Debounce la sélection pour éviter les appels immédiats pendant la sélection
  useEffect(() => {
    // Nettoyer le timeout précédent
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (
      selectionContext &&
      selectionContext.text.trim() &&
      settings.aiAssistantEnabled
    ) {
      // Montrer l'indicateur d'attente immédiatement
      setIsWaitingForSelection(true);
      
      // Ajouter un délai de 800ms avant de générer l'explication
      // Cela permet à l'utilisateur de terminer sa sélection
      debounceTimeoutRef.current = setTimeout(() => {
        setIsWaitingForSelection(false);
        setShouldGenerateExplanation(true);
      }, 800);
    } else {
      setIsWaitingForSelection(false);
      setShouldGenerateExplanation(false);
      setResponse("");
      setError("");
      setCurrentModel("");
    }

    // Nettoyage
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectionContext, settings.aiAssistantEnabled]);

  // Effet séparé pour la génération d'explication
  useEffect(() => {
    if (shouldGenerateExplanation && selectionContext) {
      generateExplanation();
      setShouldGenerateExplanation(false);
    }
  }, [shouldGenerateExplanation, generateExplanation, selectionContext]);

  useEffect(() => {
    setCurrentModel(model);
  }, [model]);

  const handleModelChange = async (newModel: string) => {
    await updateSettings({ defaultModel: newModel });
    setShowSettingsModal(false);
  };

  const handleToggleAIAssistant = async (enabled: boolean) => {
    await updateSettings({
      aiAssistantEnabled: enabled,
    });
  };

  const handleAddToNote = () => {
    if (!response) return;

    // Ajouter le texte brut sans liaison au mot surligné
    const plainText = response;

    // Trigger l'ajout du texte brut
    const event = new CustomEvent("add-to-note", {
      detail: {
        content: plainText,
      },
    });
    window.dispatchEvent(event);

    // Réinitialiser l'état pour revenir au mode par défaut
    setResponse("");
    setError("");
    setCurrentModel("");

    // Notifier le parent que "Add to note" a été cliqué
    if (onAddToNote) {
      onAddToNote();
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div
        className={`border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0 ${isMobile ? "px-4 py-3" : "px-4 py-2"}`}
      >
        <div className="flex items-center gap-2">
          <h3
            className={`font-semibold text-gray-900 ${isMobile ? "text-base" : "text-sm"}`}
          >
            AI Assistant
          </h3>
          <button
            onClick={() =>
              handleToggleAIAssistant(!settings.aiAssistantEnabled)
            }
            className={`
              px-2 py-0.5 rounded text-xs font-medium transition-all
              ${
                settings.aiAssistantEnabled
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }
            `}
            title={
              settings.aiAssistantEnabled
                ? "Disable AI Assistant"
                : "Enable AI Assistant"
            }
          >
            {settings.aiAssistantEnabled ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {/* Bouton de visibilité */}
          {onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title={isVisible ? "Hide AI Assistant" : "Show AI Assistant"}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isVisible ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                )}
              </svg>
            </button>
          )}
          
          {/* Bouton de paramètres */}
          <button
            onClick={() => setShowSettingsModal(!showSettingsModal)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Configure model"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AISettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        apiKey={apiKey}
        model={model}
        onModelChange={handleModelChange}
        isMobile={isMobile}
      />

      {/* Content */}
      {isVisible && (
      <div
        className={`flex-1 min-h-0 overflow-auto ${isMobile ? "p-4" : "p-4"}`}
      >
        {!selectionContext && !loading && !response && !isWaitingForSelection && (
          <div
            className={`text-center text-gray-500 ${isMobile ? "py-6" : "py-4"}`}
          >
            <svg
              className="w-8 h-8 mx-auto mb-2 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <p className="text-sm">
              Select text in the editor to get AI explanations
            </p>
          </div>
        )}

        {isWaitingForSelection && (
          <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="font-medium">Sélection détectée...</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Terminez votre sélection pour obtenir une explication
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {response && !loading && (
          <div className="space-y-3">
            {/* Model Info and Actions */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
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
                <span className="text-xs font-medium text-blue-800">
                  {DEFAULT_MODELS.find((m) => m.id === currentModel)?.name ||
                    currentModel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateExplanation}
                  disabled={loading}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Regenerate response"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h5M20 11A8.1 8.1 0 004.5 9.5M4 5.5A8.1 8.1 0 0019.5 14.5"
                    ></path>
                  </svg>
                </button>
                <button
                  onClick={handleAddToNote}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  title="Add to note"
                >
                  Add to note
                </button>
              </div>
            </div>

            {/* Response Content */}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code(props) {
                    const { className, children } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;
                    return !isInline ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match?.[1] || "text"}
                        PreTag="div"
                        className="text-xs"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className}>{children}</code>
                    );
                  },
                }}
              >
                {response}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {selectionContext && !loading && !error && !response && !isWaitingForSelection && (
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
            <p className="font-medium mb-1">Texte sélectionné :</p>
            <p className="italic">&ldquo;{selectionContext.text}&rdquo;</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
