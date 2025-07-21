import { OpenRouterModel, AIResponse } from '@/types';

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
      console.error('Erreur lors de la récupération des modèles:', error);
      throw error;
    }
  }

  async generateCompletion(
    prompt: string,
    model: string = 'openai/gpt-3.5-turbo',
    systemPrompt?: string
  ): Promise<AIResponse> {
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

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'OpenRouter Notes'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
      }

      const data = await response.json();
      
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

  async explainSelection(
    selectedText: string,
    context: string,
    model: string = 'openai/gpt-3.5-turbo'
  ): Promise<AIResponse> {
    const systemPrompt = `Tu es un assistant IA spécialisé dans l'explication de concepts. 
Ton rôle est d'expliquer clairement et de manière concise le texte sélectionné par l'utilisateur.
Adapte ton niveau d'explication au contexte fourni.
Sois précis, informatif et utile.`;

    const prompt = `Contexte de la page: ${context}

Texte sélectionné à expliquer: "${selectedText}"

Peux-tu expliquer ce texte de manière claire et concise ?`;

    return this.generateCompletion(prompt, model, systemPrompt);
  }

  async processSlashCommand(
    command: string,
    context: string,
    model: string = 'openai/gpt-3.5-turbo'
  ): Promise<AIResponse> {
    const systemPrompt = `Tu es un assistant IA pour une application de prise de notes similaire à Notion.
L'utilisateur peut taper "/" suivi d'une commande pour obtenir de l'aide.
Réponds de manière directe et utile selon le contexte de la page.
Formate ta réponse en markdown si approprié.`;

    const prompt = `Contexte de la page: ${context}

Commande de l'utilisateur: ${command}

Peux-tu répondre à cette demande ?`;

    return this.generateCompletion(prompt, model, systemPrompt);
  }
}

// Modèles populaires par défaut
export const DEFAULT_MODELS = [
  {
    id: 'anthropic/claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    description: 'Modèle performant d\'Anthropic',
    context_length: 200000,
    pricing: { prompt: '0.003', completion: '0.015' }
  },
  {
    id: 'moonshotai/kimi-k2',
    name: 'Kimi (Moonshot) 128K',
    description: 'Modèle Kimi avec contexte étendu',
    context_length: 128000,
    pricing: { prompt: '0.0012', completion: '0.0012' }
  }
] as OpenRouterModel[];