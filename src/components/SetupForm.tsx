"use client";

import { useState, useEffect } from "react";
import { useNotesStore } from "@/lib/store";
import { DEFAULT_MODELS } from "@/lib/openrouter";

export default function SetupForm() {
  const { updateSettings, settings } = useNotesStore();
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    "anthropic/claude-sonnet-4",
  );
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger les paramètres existants depuis le store au démarrage, une seule fois.
  useEffect(() => {
    if (settings.openrouterApiKey) {
      setApiKey(settings.openrouterApiKey);
      setSelectedModel(settings.defaultModel);
      setDefaultLanguage(settings.defaultLanguage || "en");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forcer le scroll sur cette page
  useEffect(() => {
    // Sauvegarder l'état actuel
    const originalOverflow = document.body.style.overflow;

    // Permettre le scroll
    document.body.style.overflow = "auto";

    // Nettoyer au démontage
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your OpenRouter API key");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Valider la clé API en tentant de récupérer les modèles
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Invalid API key");
      }

      // Sauvegarder les paramètres dans IndexedDB
      await updateSettings({
        openrouterApiKey: apiKey,
        defaultModel: selectedModel,
        defaultLanguage: defaultLanguage,
      });
    } catch (err) {
      console.error("Setup error:", err);
      setError("Invalid API key. Please check your key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 h-full overflow-y-auto">
        <div className="max-w-md mx-auto bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 md:pt-2">
          <div className="text-center mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Noted.cloud
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                OpenRouter API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk-or-v1-..."
                disabled={isLoading}
              />
              <p className="mt-2 text-xs text-gray-500">
                Get your free API key from{" "}
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
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Default Model
              </label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label
                htmlFor="defaultLanguage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Default Language
              </label>
              <input
                type="text"
                id="defaultLanguage"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full bg-blue-600 text-white py-2 md:py-3 px-4 text-sm md:text-base font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating...
                </div>
              ) : (
                "Get Started"
              )}
            </button>
          </form>
          <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-6 text-left">
            <p className="text-xs md:text-sm text-blue-700 mb-3 md:mb-4 leading-relaxed">
              The intelligent note-taking app that brings AI-powered
              explanations directly to your writing workflow.
            </p>

            <div className="grid gap-2 md:gap-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-medium text-blue-900">
                    GitHub-style Markdown
                  </div>
                  <div className="text-xs text-blue-700">
                    Write with familiar syntax, preview mode included
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-medium text-blue-900">
                    AI-Powered Explanations
                  </div>
                  <div className="text-xs text-blue-700">
                    Select text → get instant contextual explanations
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-medium text-green-900">
                    Smart Citations
                  </div>
                  <div className="text-xs text-green-700">
                    AI explanations are automatically linked to your highlighted text
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-medium text-blue-900">
                    Share & Collaborate
                  </div>
                  <div className="text-xs text-blue-700">
                    Make pages public with shareable links
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200">
              <div className="text-xs text-blue-600 font-medium">
                ✨ Perfect for students, researchers, writers, and knowledge
                workers
              </div>
            </div>
          </div>
          {/* Product Hunt Badge - Mobile */}
          <div className="mt-6 text-center md:hidden">
            <a
              href="https://www.producthunt.com/products/noted-cloud?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-noted&#0045;cloud"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=996188&theme=light&t=1753193235000"
                alt="Noted.cloud - Bring Contextual AI Explanations to Any Note | Product Hunt"
                style={{ width: "200px", height: "43px" }}
                width="200"
                height="43"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Product Hunt Badge - Desktop Fixed */}
      <div className="hidden md:block fixed bottom-4 right-4 z-50">
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
            className="shadow-lg rounded-lg hover:shadow-xl transition-shadow"
          />
        </a>
      </div>
    </div>
  );
}
