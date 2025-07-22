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

  private getSystemPromptForLanguage(language: string, basePrompt: string): string {
    return `${basePrompt}\n\nIMPORTANT: You must respond in the language corresponding to the following ISO 639-1 code: ${language}.`;
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
    
    const baseSystemPrompt = `You are an AI assistant specialized in explaining concepts. Your primary task is to explain the user's selected text.
The provided page context should *only* be used to understand the topic better, but you must not mention the context in your answer.
Your explanation must focus exclusively on the selected text.
Provide a direct and concise explanation. Do not start your answer with "In the context of..." or "The selected text...".
For example, if the selected text is "Eminem", and the context is an article about "50 Cent", your response should start directly with "Eminem is an American rapper..." and not "In this article about 50 Cent, Eminem is...".`;

    const systemPrompt = this.getSystemPromptForLanguage(language, baseSystemPrompt);
    console.log('System prompt:', systemPrompt);

    const prompt = `Page context: """${context}"""\n\nText to explain: """${selectedText}"""\n\nPlease provide a clear and concise explanation of the "Text to explain".`;

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

    const prompt = `Page context: """${context}"""\n\nUser command: """${command}"""\n\nPlease respond to this command.`;

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