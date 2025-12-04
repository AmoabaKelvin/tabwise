import { saveApiKey, getApiKey, saveSelectedModel, getSelectedModel } from '../lib/storage';
import { fetchOpenAIModels } from '../lib/models';
import { OrganizeResult, StatusResponse } from '../types';

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

  // Check if already organizing
  const status = await getStatus();
  if (status.isOrganizing) {
    setLoading(true);
    pollStatus();
  } else if (status.lastResult) {
    showResult(status.lastResult);
  }
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

// Show result from organization
function showResult(result: OrganizeResult): void {
  if (result.success) {
    setStatus(
      `Organized ${result.tabsOrganized} tabs into ${result.groupsCreated} groups`,
      'success'
    );
  } else {
    setStatus(result.error || 'An error occurred', 'error');
  }
}

// Get status from service worker
async function getStatus(): Promise<StatusResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response: StatusResponse) => {
      resolve(response || { isOrganizing: false });
    });
  });
}

// Poll status while organizing
function pollStatus(): void {
  const interval = setInterval(async () => {
    const status = await getStatus();
    if (!status.isOrganizing) {
      clearInterval(interval);
      setLoading(false);
      if (status.lastResult) {
        showResult(status.lastResult);
      }
    }
  }, 500);
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

// Organize tabs - send message to service worker
async function handleOrganize(): Promise<void> {
  if (isLoading) return;

  const apiKey = await getApiKey();
  if (!apiKey) {
    setStatus('Please save your API key first', 'error');
    return;
  }

  setLoading(true);
  setStatus('', '');

  // Send message to service worker
  chrome.runtime.sendMessage({ type: 'ORGANIZE_TABS' }, (result: OrganizeResult) => {
    setLoading(false);
    if (result) {
      showResult(result);
    }
  });
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
