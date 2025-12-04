import { STORAGE_KEYS } from '../types';

const DEFAULT_MODEL = 'gpt-4o-mini';

export async function saveApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: key });
}

export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
  return result[STORAGE_KEYS.API_KEY] || null;
}

export async function clearApiKey(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.API_KEY);
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return key !== null && key.length > 0;
}

export async function saveSelectedModel(modelId: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SELECTED_MODEL]: modelId });
}

export async function getSelectedModel(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SELECTED_MODEL);
  return result[STORAGE_KEYS.SELECTED_MODEL] || DEFAULT_MODEL;
}
