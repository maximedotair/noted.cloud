'use client';

import { useState, useEffect } from 'react';
import { useNotesStore } from '@/lib/store';
import { DEFAULT_MODELS } from '@/lib/openrouter';

export default function SetupForm() {
  const { updateSettings, settings } = useNotesStore();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger les paramètres existants depuis le store au démarrage, une seule fois.
  useEffect(() => {
    if (settings.openrouterApiKey) {
      setApiKey(settings.openrouterApiKey);
      setSelectedModel(settings.defaultModel);
      setDefaultLanguage(settings.defaultLanguage || 'en');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your OpenRouter API key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Valider la clé API en tentant de récupérer les modèles
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      // Sauvegarder les paramètres dans IndexedDB
      await updateSettings({
        openrouterApiKey: apiKey,
        defaultModel: selectedModel,
        defaultLanguage: defaultLanguage,
      });

    } catch (err) {
      console.error('Setup error:', err);
      setError('Invalid API key. Please check your key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Noted.cloud
          </h1>
          <p className="text-gray-600">
            Configure your application to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="sk-or-v1-..."
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Get your free API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                openrouter.ai
              </a>
            </p>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Default Model
            </label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              {DEFAULT_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <input
              type="text"
              id="defaultLanguage"
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="en"
              maxLength={2}
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              ISO 639-1 language code (e.g., en, fr, es)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validating...
              </div>
            ) : (
              'Get Started'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}