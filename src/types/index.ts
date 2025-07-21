export interface Page {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  children: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  openrouterApiKey: string;
  defaultModel: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LocalStorage {
  pages: { [id: string]: Page };
  settings: AppSettings;
  currentPageId: string | null;
}