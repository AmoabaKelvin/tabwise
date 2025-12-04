// Tab information sent to OpenAI
export interface TabInfo {
  id: number;
  title: string;
  url: string;
  groupName?: string; // Existing group name if any
}

// A single group from OpenAI response
export interface TabGroup {
  name: string;
  color: chrome.tabGroups.ColorEnum;
  tabIds: number[];
}

// OpenAI structured output response
export interface OrganizeResponse {
  groups: TabGroup[];
}

// Chrome tab group colors
export type TabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

// Storage keys
export const STORAGE_KEYS = {
  API_KEY: 'openai_api_key',
  SELECTED_MODEL: 'selected_model',
} as const;

// OpenRouter model info
export interface OpenRouterModel {
  id: string;
  name: string;
}

// Simplified model for our dropdown
export interface ModelOption {
  id: string;    // stripped model ID (e.g., "gpt-5.1")
  name: string;  // display name (e.g., "GPT-5.1")
}

// OpenAI API types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  response_format: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
    };
  };
}

export interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}
