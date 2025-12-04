import { ModelOption } from '../types';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

interface OpenRouterResponse {
  data: Array<{
    id: string;
    name: string;
  }>;
}

export async function fetchOpenAIModels(): Promise<ModelOption[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();

    // Filter to only OpenAI models and transform
    const openaiModels = data.data
      .filter(model => model.id.startsWith('openai/'))
      .map(model => ({
        id: model.id.replace('openai/', ''),  // Strip "openai/" prefix
        name: model.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return openaiModels;
  } catch (error) {
    console.error('Failed to fetch models:', error);
    // Return fallback models if fetch fails
    return [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ];
  }
}
