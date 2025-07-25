"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useNotesStore } from "@/lib/store";
import { DEFAULT_MODELS } from "@/lib/openrouter";

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  model: string;
  onModelChange: (model: string) => Promise<void>;
  isMobile?: boolean;
}

export default function AISettingsModal({
  isOpen,
  onClose,
  apiKey,
  model,
  onModelChange,
  isMobile = false,
}: AISettingsModalProps) {
  const { updateSettings, settings } = useNotesStore();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [customModel, setCustomModel] = useState("");

  if (!isOpen) return null;

  const handleApiKeyChange = async () => {
    if (!apiKeyInput.trim()) return;

    await updateSettings({
      openrouterApiKey: apiKeyInput.trim(),
    });

    setApiKeyInput("");
    onClose();
  };

  const handleAddCustomModel = async () => {
    if (!customModel.trim()) return;

    const customModels = settings.customModels || [];
    const updatedModels = [...customModels, customModel.trim()];

    await updateSettings({
      customModels: updatedModels,
      defaultModel: customModel.trim(),
    });

    setCustomModel("");
    onClose();
  };

  const handleToggleAIAssistant = async (enabled: boolean) => {
    await updateSettings({
      aiAssistantEnabled: enabled,
    });
  };

  const availableModels = [
    ...DEFAULT_MODELS,
    ...(settings.customModels || []).map((modelId) => ({
      id: modelId,
      name: modelId,
      description: "Modèle personnalisé",
      context_length: 0,
      pricing: { prompt: "0", completion: "0" },
    })),
  ];

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-md mt-8 mb-8 flex flex-col ${
          isMobile ? "mx-4 min-h-0" : "min-h-0"
        }`}
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">AI Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Assistant Toggle */}
          <div>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">AI Assistant</span>
              <button
                onClick={() => handleToggleAIAssistant(!settings.aiAssistantEnabled)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.aiAssistantEnabled ? "bg-blue-600" : "bg-gray-200"}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.aiAssistantEnabled ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Enable or disable AI explanations
            </p>
          </div>

          {/* OpenRouter API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key
            </label>
            <div className="space-y-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-or-xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleApiKeyChange}
                disabled={!apiKeyInput.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Update API Key
              </button>
            </div>
            {apiKey && (
              <p className="text-xs text-gray-500 mt-2">
                Current: {apiKey.slice(0, 12)}...
              </p>
            )}
          </div>

          {/* Default Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <input
              type="text"
              value={settings.defaultLanguage || "en"}
              onChange={(e) =>
                updateSettings({ defaultLanguage: e.target.value })
              }
              placeholder="en, fr, es, de"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              ISO 639-1 language code (en, fr, es, etc.)
            </p>
          </div>

          {/* Default Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Model
            </label>
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Custom Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Custom Model
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="ex: anthropic/claude-3-opus"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddCustomModel}
                disabled={!customModel.trim()}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Model
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add a custom model from OpenRouter (provider/model-name format)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Utiliser createPortal pour rendre au niveau du body
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
} 