import { saveApiKey, getApiKey, saveSelectedModel, getSelectedModel } from '../lib/storage';
import { getCurrentWindowTabs, organizeTabsIntoGroups, getTabCount } from '../lib/tabs';
import { organizeWithAI } from '../lib/openai';
import { fetchOpenAIModels } from '../lib/models';

// DOM Elements
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const saveKeyBtn = document.getElementById('save-key') as HTMLButtonElement;
const keyStatus = document.getElementById('key-status') as HTMLParagraphElement;
const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
const organizeBtn = document.getElementById('organize-btn') as HTMLButtonElement;
const btnText = document.getElementById('btn-text') as HTMLSpanElement;
const statusMessage = document.getElementById('status-message') as HTMLParagraphElement;

// State
let isLoading = false;

// Initialize
async function init(): Promise<void> {
  // Load API key
  const apiKey = await getApiKey();

  if (apiKey) {
    apiKeyInput.value = apiKey;
    setKeyStatus('Key saved', 'success');
    organizeBtn.disabled = false;
  } else {
    setKeyStatus('Enter your OpenAI API key', '');
    organizeBtn.disabled = true;
  }

  // Load models
  await loadModels();
}

// Load models into dropdown
async function loadModels(): Promise<void> {
  modelSelect.disabled = true;

  const models = await fetchOpenAIModels();
  const savedModel = await getSelectedModel();

  // Clear and populate dropdown
  modelSelect.innerHTML = '';

  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    if (model.id === savedModel) {
      option.selected = true;
    }
    modelSelect.appendChild(option);
  });

  // If saved model not in list, select first option
  if (!models.some(m => m.id === savedModel) && models.length > 0) {
    modelSelect.value = models[0].id;
    await saveSelectedModel(models[0].id);
  }

  modelSelect.disabled = false;
}

// Handle model selection change
async function handleModelChange(): Promise<void> {
  const selectedModel = modelSelect.value;
  await saveSelectedModel(selectedModel);
}

// Set key status message
function setKeyStatus(message: string, type: '' | 'success' | 'error'): void {
  keyStatus.textContent = message;
  keyStatus.className = 'hint' + (type ? ` ${type}` : '');
}

// Set status message
function setStatus(message: string, type: '' | 'success' | 'error'): void {
  statusMessage.textContent = message;
  statusMessage.className = 'status' + (type ? ` ${type}` : '');
}

// Set loading state
function setLoading(loading: boolean): void {
  isLoading = loading;
  organizeBtn.disabled = loading;
  organizeBtn.classList.toggle('loading', loading);
  btnText.textContent = loading ? 'Organizing...' : 'Organize Tabs';
}

// Save API key
async function handleSaveKey(): Promise<void> {
  const key = apiKeyInput.value.trim();

  if (!key) {
    setKeyStatus('Please enter a valid API key', 'error');
    organizeBtn.disabled = true;
    return;
  }

  if (!key.startsWith('sk-')) {
    setKeyStatus('Invalid API key format', 'error');
    organizeBtn.disabled = true;
    return;
  }

  await saveApiKey(key);
  setKeyStatus('Key saved', 'success');
  organizeBtn.disabled = false;
  setStatus('', '');
}

// Organize tabs
async function handleOrganize(): Promise<void> {
  if (isLoading) return;

  const apiKey = await getApiKey();
  if (!apiKey) {
    setStatus('Please save your API key first', 'error');
    return;
  }

  setLoading(true);
  setStatus('', '');

  try {
    // Get all tabs
    const tabs = await getCurrentWindowTabs();

    if (tabs.length === 0) {
      setStatus('No tabs to organize', 'error');
      setLoading(false);
      return;
    }

    if (tabs.length === 1) {
      setStatus('Need at least 2 tabs to organize', 'error');
      setLoading(false);
      return;
    }

    // Call OpenAI
    const selectedModel = await getSelectedModel();
    const result = await organizeWithAI(apiKey, tabs, selectedModel);

    if (result.groups.length === 0) {
      setStatus('Could not organize tabs', 'error');
      setLoading(false);
      return;
    }

    // Apply tab groups
    const groupsCreated = await organizeTabsIntoGroups(result.groups);
    const tabsOrganized = getTabCount(result.groups);

    setStatus(
      `Organized ${tabsOrganized} tabs into ${groupsCreated} groups`,
      'success'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    setStatus(message, 'error');
  } finally {
    setLoading(false);
  }
}

// Event listeners
saveKeyBtn.addEventListener('click', handleSaveKey);
organizeBtn.addEventListener('click', handleOrganize);
modelSelect.addEventListener('change', handleModelChange);

// Allow saving with Enter key
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSaveKey();
  }
});

// Initialize on load
init();
