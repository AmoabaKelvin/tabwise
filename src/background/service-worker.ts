import { Message, OrganizeResult, StatusResponse, TabState, UndoResult } from '../types';
import { getApiKey, getSelectedModel, getAutoOrganizeEnabled, getAutoOrganizeThreshold } from '../lib/storage';
import { getCurrentWindowTabs, organizeTabsIntoGroups, getTabCount, captureTabState, restorePreviousState } from '../lib/tabs';
import { organizeWithAI } from '../lib/openai';

// State
let isOrganizing = false;
let lastResult: OrganizeResult | undefined;
let previousTabState: TabState[] | undefined; // Store previous state for undo
let autoOrganizeTimeout: ReturnType<typeof setTimeout> | null = null;

// Handle messages from popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'ORGANIZE_TABS') {
    handleOrganize().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_STATUS') {
    const status: StatusResponse = {
      isOrganizing,
      lastResult,
      canUndo: previousTabState !== undefined && previousTabState.length > 0
    };
    sendResponse(status);
    return false;
  }

  if (message.type === 'UNDO_ORGANIZE') {
    handleUndo().then(sendResponse);
    return true; // Keep channel open for async response
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

    // Capture current state before organizing for undo
    previousTabState = await captureTabState();

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
    // Clear previous state if organization failed
    previousTabState = undefined;
  } finally {
    isOrganizing = false;
  }

  return lastResult;
}

async function handleUndo(): Promise<UndoResult> {
  if (!previousTabState || previousTabState.length === 0) {
    return { success: false, error: 'No previous state to restore' };
  }

  try {
    const tabsRestored = await restorePreviousState(previousTabState);

    // Clear the previous state after successful undo (only one level of undo)
    previousTabState = undefined;
    lastResult = undefined;

    return {
      success: true,
      tabsRestored
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore tabs'
    };
  }
}

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'organize-tabs') {
    handleOrganize().catch((error) => {
      console.error('Failed to organize tabs:', error);
    });
  }
});

// Check if auto-organize should be triggered
async function checkAutoOrganize(windowId: number): Promise<void> {
  // Debounce auto-organize checks to avoid triggering too frequently
  if (autoOrganizeTimeout) {
    clearTimeout(autoOrganizeTimeout);
  }

  autoOrganizeTimeout = setTimeout(async () => {
    try {
      const autoOrganizeEnabled = await getAutoOrganizeEnabled();

      if (!autoOrganizeEnabled) {
        return;
      }

      // Check if API key is set
      const apiKey = await getApiKey();
      if (!apiKey) {
        return;
      }

      // Don't trigger if already organizing
      if (isOrganizing) {
        return;
      }

      // Get tab count in the window - only count ungrouped tabs
      const tabs = await chrome.tabs.query({ windowId });
      const ungroupedTabs = tabs.filter(tab =>
        !tab.pinned && tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE
      );

      const threshold = await getAutoOrganizeThreshold();

      if (ungroupedTabs.length >= threshold) {
        // Trigger auto-organize
        console.log(`Auto-organizing: ${ungroupedTabs.length} ungrouped tabs exceeds threshold of ${threshold}`);
        await handleOrganize();
      }
    } catch (error) {
      console.error('Auto-organize check failed:', error);
    }
  }, 1000); // Wait 1 second after last tab creation
}

// Listen for tab creation to trigger auto-organize
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.windowId && !tab.pinned) {
    checkAutoOrganize(tab.windowId);
  }
});

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Tabwise installed');
  } else if (details.reason === 'update') {
    console.log('Tabwise updated');
  }
});
