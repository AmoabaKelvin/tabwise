import { saveApiKey, getApiKey, saveSelectedModel, getSelectedModel, saveAutoOrganizeEnabled, getAutoOrganizeEnabled, saveAutoOrganizeThreshold, getAutoOrganizeThreshold } from '../lib/storage';
import { fetchOpenAIModels } from '../lib/models';
import { OrganizeResult, StatusResponse, UndoResult } from '../types';

// DOM Elements
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const saveKeyBtn = document.getElementById('save-key') as HTMLButtonElement;
const keyStatus = document.getElementById('key-status') as HTMLParagraphElement;
const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
const autoOrganizeToggle = document.getElementById('auto-organize-toggle') as HTMLInputElement;
const thresholdRow = document.getElementById('threshold-row') as HTMLDivElement;
const thresholdInput = document.getElementById('threshold-input') as HTMLInputElement;
const organizeBtn = document.getElementById('organize-btn') as HTMLButtonElement;
const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
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

  // Load auto-organize settings
  const autoOrganizeEnabled = await getAutoOrganizeEnabled();
  const threshold = await getAutoOrganizeThreshold();
  autoOrganizeToggle.checked = autoOrganizeEnabled;
  thresholdInput.value = threshold.toString();
  thresholdRow.style.display = autoOrganizeEnabled ? 'flex' : 'none';

  // Check if already organizing
  const status = await getStatus();
  if (status.isOrganizing) {
    setLoading(true);
    pollStatus();
  } else if (status.lastResult) {
    showResult(status.lastResult);
  }

  // Update undo button visibility
  updateUndoButton(status.canUndo);
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

// Update undo button visibility
function updateUndoButton(canUndo: boolean): void {
  if (canUndo) {
    undoBtn.style.display = 'flex';
  } else {
    undoBtn.style.display = 'none';
  }
}

// Get status from service worker
async function getStatus(): Promise<StatusResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response: StatusResponse) => {
      resolve(response || { isOrganizing: false, canUndo: false });
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
      updateUndoButton(status.canUndo);
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
  chrome.runtime.sendMessage({ type: 'ORGANIZE_TABS' }, async (result: OrganizeResult) => {
    setLoading(false);
    if (result) {
      showResult(result);
      // Update undo button visibility after organizing
      const status = await getStatus();
      updateUndoButton(status.canUndo);
    }
  });
}

// Handle undo - send message to service worker
async function handleUndo(): Promise<void> {
  if (isLoading) return;

  setLoading(true);
  setStatus('', '');

  // Send message to service worker
  chrome.runtime.sendMessage({ type: 'UNDO_ORGANIZE' }, async (result: UndoResult) => {
    setLoading(false);
    if (result) {
      if (result.success) {
        setStatus(`Restored ${result.tabsRestored} tabs to previous arrangement`, 'success');
      } else {
        setStatus(result.error || 'Failed to restore tabs', 'error');
      }
      // Update undo button visibility after undo
      const status = await getStatus();
      updateUndoButton(status.canUndo);
    }
  });
}

// Handle auto-organize toggle
async function handleAutoOrganizeToggle(): Promise<void> {
  const enabled = autoOrganizeToggle.checked;
  await saveAutoOrganizeEnabled(enabled);
  thresholdRow.style.display = enabled ? 'flex' : 'none';
}

// Handle threshold change
async function handleThresholdChange(): Promise<void> {
  let threshold = parseInt(thresholdInput.value, 10);
  if (isNaN(threshold)) {
    threshold = await getAutoOrganizeThreshold();
  } else {
    threshold = Math.max(5, Math.min(100, threshold));
  }
  thresholdInput.value = threshold.toString();
  await saveAutoOrganizeThreshold(threshold);
}

// Event listeners
saveKeyBtn.addEventListener('click', handleSaveKey);
organizeBtn.addEventListener('click', handleOrganize);
undoBtn.addEventListener('click', handleUndo);
modelSelect.addEventListener('change', handleModelChange);
autoOrganizeToggle.addEventListener('change', handleAutoOrganizeToggle);
thresholdInput.addEventListener('change', handleThresholdChange);

// Allow saving with Enter key
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSaveKey();
  }
});

// Initialize on load
init();
