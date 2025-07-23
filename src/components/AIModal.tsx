"use client";

import { useState } from "react";
import { useSettings, useNotesStore } from "@/lib/store";
import { OpenRouterAPI, DEFAULT_MODELS } from "@/lib/openrouter";

interface AIModalProps {
  context: {
    type: "explain" | "command";
    selectedText?: string;
    command?: string;
    position?: { x: number; y: number };
  };
  onClose: () => void;
  currentPageContent: string;
  isMobile?: boolean;
}

export default function AIModal({
  context,
  onClose,
  currentPageContent,
  isMobile = false,
}: AIModalProps) {
  const settings = useSettings();
  const { updateSettings } = useNotesStore();
  const [selectedModel, setSelectedModel] = useState(settings.defaultModel);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [showAddModel, setShowAddModel] = useState(false);

  // Combiner modèles par défaut et modèles personnalisés
  const availableModels = [
    ...DEFAULT_MODELS.map((model) => ({ id: model.id, name: model.name })),
    ...(settings.customModels || []).map((model) => ({
      id: model,
      name: model,
    })),
  ];

  const generateAIResponse = async () => {
    try {
      setIsLoading(true);
      setError("");
      setHasStarted(true);

      if (!settings.openrouterApiKey) {
        throw new Error("OpenRouter API key not configured");
      }

      const api = new OpenRouterAPI(settings.openrouterApiKey);

      let aiResponse;

      if (context.type === "explain" && context.selectedText) {
        aiResponse = await api.explainSelection(
          context.selectedText,
          currentPageContent,
          selectedModel,
          settings.defaultLanguage,
        );
      } else if (context.type === "command" && context.command) {
        aiResponse = await api.processSlashCommand(
          context.command,
          currentPageContent,
          selectedModel,
          settings.defaultLanguage,
        );
      } else {
        throw new Error("Invalid context");
      }

      setResponse(aiResponse.content);
    } catch (err) {
      console.error("AI Error:", err);
      setError(err instanceof Error ? err.message : "Error during generation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertResponse = () => {
    if (
      response &&
      (
        window as Window & {
          insertTextAtCursor?: (text: string, selectedText?: string) => void;
        }
      ).insertTextAtCursor
    ) {
      // Passer le texte sélectionné pour les explications afin de créer une citation
      const selectedText =
        context.type === "explain" ? context.selectedText : undefined;
      (
        window as Window & {
          insertTextAtCursor?: (text: string, selectedText?: string) => void;
        }
      ).insertTextAtCursor!(response, selectedText);
    }
    onClose();
  };

  const handleStartRequest = () => {
    generateAIResponse();
  };

  const handleRetry = () => {
    generateAIResponse();
  };

  const handleAddModel = async () => {
    if (!newModel.trim()) return;

    const currentCustomModels = settings.customModels || [];
    if (currentCustomModels.includes(newModel.trim())) {
      setError("This model already exists");
      return;
    }

    const updatedCustomModels = [...currentCustomModels, newModel.trim()];
    await updateSettings({ customModels: updatedCustomModels });
    setNewModel("");
    setShowAddModel(false);
    setSelectedModel(newModel.trim());
  };

  const getRequestPreview = () => {
    if (context.type === "explain" && context.selectedText) {
      return `Explain text: "${context.selectedText.substring(0, 100)}${context.selectedText.length > 100 ? "..." : ""}"`;
    } else if (context.type === "command" && context.command) {
      return `Command: /${context.command}`;
    }
    return "AI Request";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b border-gray-200 ${
            isMobile ? "p-4" : "p-4"
          }`}
        >
          <div>
            <h2
              className={`font-semibold text-gray-900 ${
                isMobile ? "text-base" : "text-lg"
              }`}
            >
              {context.type === "explain" ? "AI Explanation" : "AI Command"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{getRequestPreview()}</p>
          </div>
          <button
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-600 transition-colors ${
              isMobile ? "p-2" : ""
            }`}
          >
            <svg
              className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`}
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

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? "p-4" : "p-4"}`}>
          {!hasStarted && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready for AI assistance
              </h3>
              <p className="text-gray-500 mb-6">
                {context.type === "explain"
                  ? "AI will analyze the selected text and provide an explanation in the context of your page."
                  : "AI will process your command and generate a helpful response."}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      AI Model:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddModel(!showAddModel)}
                        className="px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Add custom model"
                      >
                        +
                      </button>
                    </div>

                    {showAddModel && (
                      <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          New model (e.g., anthropic/claude-3-opus):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newModel}
                            onChange={(e) => setNewModel(e.target.value)}
                            placeholder="provider/model-name"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={handleAddModel}
                            disabled={!newModel.trim()}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowAddModel(false);
                              setNewModel("");
                            }}
                            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Response Language:
                    </label>
                    <input
                      type="text"
                      value={settings.defaultLanguage || "en"}
                      onChange={(e) =>
                        updateSettings({ defaultLanguage: e.target.value })
                      }
                      placeholder="en, fr, es, etc."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ISO 639-1 language code (en, fr, es, etc.)
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Context:</span>
                    <span className="font-medium">
                      {currentPageContent.length} characters
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleStartRequest}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✨ Generate AI Response
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">AI is thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 font-medium mb-2">
                  Error during generation
                </p>
                <p className="text-red-500 text-sm">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {response && !isLoading && (
            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {response && !isLoading && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              Response generated with {selectedModel}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={handleInsertResponse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Insert into page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
