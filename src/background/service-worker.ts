import { Message, OrganizeResult, StatusResponse } from '../types';
import { getApiKey, getSelectedModel } from '../lib/storage';
import { getCurrentWindowTabs, organizeTabsIntoGroups, getTabCount } from '../lib/tabs';
import { organizeWithAI } from '../lib/openai';

// State
let isOrganizing = false;
let lastResult: OrganizeResult | undefined;

// Handle messages from popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'ORGANIZE_TABS') {
    handleOrganize().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_STATUS') {
    const status: StatusResponse = { isOrganizing, lastResult };
    sendResponse(status);
    return false;
  }

  return false;
});

async function handleOrganize(): Promise<OrganizeResult> {
  if (isOrganizing) {
    return { success: false, error: 'Already organizing' };
  }

  isOrganizing = true;
  lastResult = undefined;

  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('Please save your API key first');
    }

    const tabs = await getCurrentWindowTabs();

    if (tabs.length === 0) {
      throw new Error('No tabs to organize');
    }

    if (tabs.length === 1) {
      throw new Error('Need at least 2 tabs to organize');
    }

    const selectedModel = await getSelectedModel();
    const result = await organizeWithAI(apiKey, tabs, selectedModel);

    if (result.groups.length === 0) {
      throw new Error('Could not organize tabs');
    }

    const groupsCreated = await organizeTabsIntoGroups(result.groups);
    const tabsOrganized = getTabCount(result.groups);

    lastResult = {
      success: true,
      tabsOrganized,
      groupsCreated,
    };
  } catch (error) {
    lastResult = {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  } finally {
    isOrganizing = false;
  }

  return lastResult;
}

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Tabwise installed');
  } else if (details.reason === 'update') {
    console.log('Tabwise updated');
  }
});
