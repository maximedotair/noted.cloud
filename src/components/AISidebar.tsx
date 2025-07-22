'use client';

import { useState, useEffect, useCallback } from 'react';
import { OpenRouterAPI, DEFAULT_MODELS } from '@/lib/openrouter';
import { useNotesStore } from '@/lib/store';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AISidebarProps {
  selectedText: string | null;
  apiKey: string;
  model: string;
}

export default function AISidebar({ selectedText, apiKey, model }: AISidebarProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [currentModel, setCurrentModel] = useState(model);
  const [showSettings, setShowSettings] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const { updateSettings, settings } = useNotesStore();

  const generateExplanation = useCallback(async () => {
    if (!selectedText || !settings.aiAssistantEnabled) return;

    // Debug logging
    console.log('AISidebar - generateExplanation called');
    console.log('API Key:', apiKey ? `${apiKey.slice(0, 10)}...` : 'MISSING');
    console.log('Model:', model);
    console.log('Selected text:', selectedText);
    console.log('AI Assistant Enabled:', settings.aiAssistantEnabled);
    console.log('Default Language:', settings.defaultLanguage);

    if (!apiKey || !apiKey.trim()) {
      setError('No API key configured. Please check your settings.');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const api = new OpenRouterAPI(apiKey);
      const result = await api.explainSelection(
        selectedText,
        'User is taking notes and wants explanation of selected text',
        model,
        settings.defaultLanguage
      );

      if (result.content) {
        setResponse(result.content);
        setCurrentModel(model);
      } else {
        setError('No response received');
      }
    } catch (err) {
      console.error('Error calling OpenRouter:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedText, apiKey, model, settings.aiAssistantEnabled, settings.defaultLanguage]);

  useEffect(() => {
    if (selectedText && selectedText.trim() && settings.aiAssistantEnabled) {
      generateExplanation();
    } else {
      setResponse('');
      setError('');
      setCurrentModel('');
    }
  }, [selectedText, generateExplanation, settings.aiAssistantEnabled]);

  useEffect(() => {
    setCurrentModel(model);
  }, [model]);

  const handleModelChange = async (newModel: string) => {
    await updateSettings({ defaultModel: newModel });
    setShowSettings(false);
  };

  const handleAddCustomModel = async () => {
    if (!customModel.trim()) return;
    
    const customModels = settings.customModels || [];
    const updatedModels = [...customModels, customModel.trim()];
    
    await updateSettings({
      customModels: updatedModels,
      defaultModel: customModel.trim()
    });
    
    setCustomModel('');
    setShowSettings(false);
  };

  const handleApiKeyChange = async () => {
    if (!apiKeyInput.trim()) return;
    
    await updateSettings({
      openrouterApiKey: apiKeyInput.trim()
    });
    
    setApiKeyInput('');
    setShowSettings(false);
  };

  const handleToggleAIAssistant = async (enabled: boolean) => {
    await updateSettings({
      aiAssistantEnabled: enabled
    });
  };

  const handleAddToNote = () => {
    if (!response) return;
    
    // Ajouter le texte brut sans liaison au mot surligné
    const plainText = response;
    
    // Trigger l'ajout du texte brut
    const event = new CustomEvent('add-to-note', {
      detail: {
        content: plainText
      }
    });
    window.dispatchEvent(event);
  };

  const availableModels = [
    ...DEFAULT_MODELS,
    ...(settings.customModels || []).map(modelId => ({
      id: modelId,
      name: modelId,
      description: 'Modèle personnalisé',
      context_length: 0,
      pricing: { prompt: '0', completion: '0' }
    }))
  ];

  return (
    <div className="w-full bg-gray-50 flex flex-col max-h-60">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          AI Assistant
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Configurer le modèle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-200 bg-white p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Modèle par défaut
            </label>
            <select
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Ajouter un modèle personnalisé
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="ex: openai/gpt-4"
                className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddCustomModel}
                disabled={!customModel.trim()}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {!selectedText && !loading && !response && (
          <div className="text-center text-gray-500 py-4">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm">
              Select text in the editor to get AI explanations
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
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-xs font-medium text-blue-800">
                  {availableModels.find(m => m.id === currentModel)?.name || currentModel}
                </span>
              </div>
              <button
                onClick={handleAddToNote}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Add to note"
              >
                Add to note
              </button>
            </div>

            {/* Response Content */}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code(props) {
                    const { className, children } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return !isInline ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match?.[1] || 'text'}
                        PreTag="div"
                        className="text-xs"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {response}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {selectedText && !loading && !error && !response && (
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
            <p className="font-medium mb-1">Texte sélectionné :</p>
            <p className="italic">&ldquo;{selectedText}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}