// Tab information sent to OpenAI
export interface TabInfo {
  id: number;
  title: string;
  url: string;
  groupName?: string; // Existing group name if any
}

// Tab state for undo functionality
export interface TabState {
  tabId: number;
  groupId: number | null; // null if ungrouped
  groupTitle?: string;
  groupColor?: chrome.tabGroups.ColorEnum;
  index: number; // Tab position
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
  AUTO_ORGANIZE_ENABLED: 'auto_organize_enabled',
  AUTO_ORGANIZE_THRESHOLD: 'auto_organize_threshold',
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

// Message passing types
export type MessageType = 'ORGANIZE_TABS' | 'GET_STATUS' | 'UNDO_ORGANIZE';

export interface OrganizeTabsMessage {
  type: 'ORGANIZE_TABS';
}

export interface GetStatusMessage {
  type: 'GET_STATUS';
}

export interface UndoOrganizeMessage {
  type: 'UNDO_ORGANIZE';
}

export type Message = OrganizeTabsMessage | GetStatusMessage | UndoOrganizeMessage;

export interface OrganizeResult {
  success: boolean;
  tabsOrganized?: number;
  groupsCreated?: number;
  error?: string;
}

export interface StatusResponse {
  isOrganizing: boolean;
  lastResult?: OrganizeResult;
  canUndo: boolean; // Whether undo is available
}

export interface UndoResult {
  success: boolean;
  tabsRestored?: number;
  error?: string;
}
