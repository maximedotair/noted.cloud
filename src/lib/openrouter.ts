import { OpenRouterModel, AIResponse } from '@/types';

export const DEFAULT_MODEL_ID = 'anthropic/claude-sonnet-4';

export class OpenRouterAPI {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async generateCompletion(
    prompt: string,
    model: string = DEFAULT_MODEL_ID,
    systemPrompt?: string
  ): Promise<AIResponse> {
    // Debug logging
    console.log('OpenRouterAPI - generateCompletion called');
    console.log('API Key length:', this.apiKey ? this.apiKey.length : 0);
    console.log('API Key starts with:', this.apiKey ? this.apiKey.slice(0, 15) : 'MISSING');
    console.log('API Key format valid:', this.apiKey && this.apiKey.startsWith('sk-or-'));
    console.log('Model:', model);

    if (!this.apiKey || !this.apiKey.trim()) {
      throw new Error('No auth credentials found - API key is missing or empty');
    }
    
    if (!this.apiKey.startsWith('sk-or-')) {
      console.warn('API Key format might be invalid - should start with "sk-or-"');
    }

    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });

      const requestBody = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      };

      console.log('=== OpenRouter API Request ===');
      console.log('URL:', `${this.baseUrl}/chat/completions`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Authorization': `Bearer ${this.apiKey.slice(0, 15)}...`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000',
        'X-Title': 'Noted.cloud',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      });
      console.log('Body:', JSON.stringify(requestBody, null, 2));
      console.log('==============================');

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000',
          'X-Title': 'Noted.cloud',
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      return {
        content: data.choices[0]?.message?.content || '',
        model,
        usage: data.usage
      };
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      throw error;
    }
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common patterns
    const frenchPatterns = /\b(le|la|les|de|des|un|une|et|est|sont|pour|dans|ce|cette|que|qui|quoi|où|quand|comment|pourquoi|avec|sans|sur|sous|par|tout|tous|toutes|plus|moins|très|bien|mal|oui|non|merci|bonjour|au revoir|excusez|pardon|s'il vous plaît|voici|cela|ceci|avoir|être|avoir|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir)\b/i;
    const englishPatterns = /\b(the|a|an|and|is|are|for|in|this|that|what|where|when|how|why|with|without|on|under|by|all|more|less|very|good|bad|yes|no|thank|hello|goodbye|please|sorry|have|has|had|do|does|did|will|would|could|should|can|may|might|must)\b/i;
    const spanishPatterns = /\b(el|la|los|las|un|una|unos|unas|y|es|son|para|en|este|esta|eso|eso|qué|dónde|cuándo|cómo|por qué|con|sin|sobre|bajo|por|todo|más|menos|muy|bien|mal|sí|no|gracias|hola|adiós|por favor|lo siento|tener|ser|estar|hacer|ir|venir|ver|saber|poder|querer|deber)\b/i;
    
    const textLower = text.toLowerCase();
    
    // Count matches for each language
    const frenchMatches = (textLower.match(frenchPatterns) || []).length;
    const englishMatches = (textLower.match(englishPatterns) || []).length;
    const spanishMatches = (textLower.match(spanishPatterns) || []).length;
    
    // Return the language with most matches
    if (frenchMatches > englishMatches && frenchMatches > spanishMatches) return 'fr';
    if (spanishMatches > englishMatches && spanishMatches > frenchMatches) return 'es';
    if (englishMatches > 0) return 'en';
    
    // Default to English if no clear pattern detected
    return 'en';
  }

  private getSystemPromptForLanguage(language: string, basePrompt: string): string {
    const prompts = {
      en: basePrompt,
      fr: `Tu es un assistant IA spécialisé dans l'explication de concepts.
Ton rôle est d'expliquer clairement et concisément le texte sélectionné par l'utilisateur.
Adapte ton niveau d'explication au contexte fourni.
Sois précis, informatif et utile.
Réponds toujours en français.`,
      es: `Eres un asistente IA especializado en explicar conceptos.
Tu papel es explicar clara y concisamente el texto seleccionado por el usuario.
Adapta tu nivel de explicación al contexto proporcionado.
Sé preciso, informativo y útil.
Responde siempre en español.`
    };
    
    return prompts[language as keyof typeof prompts] || prompts.en;
  }

  async explainSelection(
    selectedText: string,
    context: string,
    model: string = DEFAULT_MODEL_ID,
    defaultLanguage: string = 'en'
  ): Promise<AIResponse> {
    const language = defaultLanguage;
    
    console.log('=== Language Settings ===');
    console.log('Context:', context);
    console.log('Selected text:', selectedText);
    console.log('Using default language:', language);
    console.log('System prompt language:', this.getSystemPromptForLanguage(language, 'test'));
    
    const baseSystemPrompt = `You are an AI assistant specialized in explaining concepts.
Your role is to clearly and concisely explain the text selected by the user.
Adapt your level of explanation to the provided context.
Be precise, informative, and helpful.`;

    const systemPrompt = this.getSystemPromptForLanguage(language, baseSystemPrompt);

    const prompts = {
      en: `Page context: ${context}\n\nSelected text to explain: "${selectedText}"\n\nCan you explain this text clearly and concisely?`,
      fr: `Contexte de la page: ${context}\n\nTexte sélectionné à expliquer: "${selectedText}"\n\nPeux-tu expliquer ce texte de manière claire et concise ?`,
      es: `Contexto de la página: ${context}\n\nTexto seleccionado para explicar: "${selectedText}"\n\n¿Puedes explicar este texto de manera clara y concisa?`
    };

    const prompt = prompts[language as keyof typeof prompts] || prompts.en;

    return this.generateCompletion(prompt, model, systemPrompt);
  }

  async processSlashCommand(
    command: string,
    context: string,
    model: string = DEFAULT_MODEL_ID,
    defaultLanguage: string = 'en'
  ): Promise<AIResponse> {
    const language = defaultLanguage;
    
    const baseSystemPrompt = `You are an AI assistant for a note-taking application similar to Notion.
The user can type "/" followed by a command to get help.
Respond directly and usefully according to the page context.
Format your response in markdown if appropriate.`;

    const systemPrompt = this.getSystemPromptForLanguage(language, baseSystemPrompt);

    const prompts = {
      en: `Page context: ${context}\n\nUser command: ${command}\n\nCan you respond to this request?`,
      fr: `Contexte de la page: ${context}\n\nCommande de l'utilisateur: ${command}\n\nPeux-tu répondre à cette demande ?`,
      es: `Contexto de la página: ${context}\n\nComando del usuario: ${command}\n\n¿Puedes responder a esta solicitud?`
    };

    const prompt = prompts[language as keyof typeof prompts] || prompts.en;

    return this.generateCompletion(prompt, model, systemPrompt);
  }
}

// Modèles populaires par défaut
export const DEFAULT_MODELS = [
  {
    id: 'DEFAULT_MODEL_ID',
    name: 'Claude 4 Sonnet',
    description: 'Modèle performant d\'Anthropic',
    context_length: 200000,
    pricing: { prompt: '0.003', completion: '0.015' }
  },
  {
    id: 'moonshotai/kimi-k2',
    name: 'Kimi k2',
    description: 'Kimi k2',
    context_length: 63000,
    pricing: { prompt: '0.0012', completion: '0.0012' }
  }
] as OpenRouterModel[];