import { STORAGE_KEYS } from '../types';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_AUTO_ORGANIZE_THRESHOLD = 15;

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

export async function saveAutoOrganizeEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AUTO_ORGANIZE_ENABLED]: enabled });
}

export async function getAutoOrganizeEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTO_ORGANIZE_ENABLED);
  return result[STORAGE_KEYS.AUTO_ORGANIZE_ENABLED] || false;
}

export async function saveAutoOrganizeThreshold(threshold: number): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AUTO_ORGANIZE_THRESHOLD]: threshold });
}

export async function getAutoOrganizeThreshold(): Promise<number> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTO_ORGANIZE_THRESHOLD);
  return result[STORAGE_KEYS.AUTO_ORGANIZE_THRESHOLD] || DEFAULT_AUTO_ORGANIZE_THRESHOLD;
}
