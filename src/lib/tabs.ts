import { TabInfo, TabGroup, TabState } from '../types';

export async function getCurrentWindowTabs(): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  // Get all tab groups in the current window
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  const groupMap = new Map<number, string>();
  groups.forEach(group => {
    groupMap.set(group.id, group.title || 'Unnamed Group');
  });

  return tabs
    .filter((tab): tab is chrome.tabs.Tab & { id: number } =>
      tab.id !== undefined && tab.id !== chrome.tabs.TAB_ID_NONE && !tab.pinned
    )
    .map(tab => ({
      id: tab.id,
      title: tab.title || 'Untitled',
      url: tab.url || '',
      groupName: tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
        ? groupMap.get(tab.groupId)
        : undefined,
    }));
}

export async function ungroupAllTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const tabIds = tabs
    .filter((tab): tab is chrome.tabs.Tab & { id: number } =>
      tab.id !== undefined && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
    )
    .map(tab => tab.id);

  if (tabIds.length > 0) {
    await chrome.tabs.ungroup(tabIds);
  }
}

export async function createTabGroup(
  name: string,
  tabIds: number[],
  color: chrome.tabGroups.ColorEnum,
  collapsed: boolean = false
): Promise<number> {
  if (tabIds.length === 0) return -1;

  const groupId = await chrome.tabs.group({ tabIds });
  await chrome.tabGroups.update(groupId, { title: name, color, collapsed });

  return groupId;
}

export async function organizeTabsIntoGroups(groups: TabGroup[]): Promise<number> {
  // Get the active tab to keep its group expanded
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTabId = activeTab?.id;

  // First, ungroup all existing tabs
  await ungroupAllTabs();

  let groupsCreated = 0;

  // Create each group
  for (const group of groups) {
    if (group.tabIds.length > 0) {
      // Collapse groups that don't contain the active tab
      const containsActiveTab = activeTabId !== undefined && group.tabIds.includes(activeTabId);
      await createTabGroup(group.name, group.tabIds, group.color, !containsActiveTab);
      groupsCreated++;
    }
  }

  return groupsCreated;
}

export function getTabCount(groups: TabGroup[]): number {
  return groups.reduce((sum, group) => sum + group.tabIds.length, 0);
}

// Capture the current state of all tabs for undo functionality
export async function captureTabState(): Promise<TabState[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

  // Create a map of group IDs to their properties
  const groupMap = new Map<number, { title: string; color: chrome.tabGroups.ColorEnum }>();
  groups.forEach(group => {
    groupMap.set(group.id, {
      title: group.title || 'Unnamed Group',
      color: group.color
    });
  });

  return tabs
    .filter((tab): tab is chrome.tabs.Tab & { id: number; index: number } =>
      tab.id !== undefined && tab.id !== chrome.tabs.TAB_ID_NONE && !tab.pinned
    )
    .map(tab => {
      const groupInfo = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
        ? groupMap.get(tab.groupId)
        : undefined;

      return {
        tabId: tab.id,
        groupId: tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE ? tab.groupId : null,
        groupTitle: groupInfo?.title,
        groupColor: groupInfo?.color,
        index: tab.index
      };
    });
}

// Restore tabs to their previous state
export async function restorePreviousState(previousState: TabState[]): Promise<number> {
  // First, ungroup all tabs
  await ungroupAllTabs();

  // Group tabs by their previous group ID
  const groupedTabs = new Map<number, TabState[]>();
  const ungroupedTabs: TabState[] = [];

  for (const state of previousState) {
    if (state.groupId === null) {
      ungroupedTabs.push(state);
    } else {
      if (!groupedTabs.has(state.groupId)) {
        groupedTabs.set(state.groupId, []);
      }
      groupedTabs.get(state.groupId)!.push(state);
    }
  }

  let tabsRestored = 0;

  // Recreate groups
  for (const [_, tabStates] of groupedTabs) {
    if (tabStates.length > 0) {
      const tabIds = tabStates.map(state => state.tabId);
      const { groupTitle, groupColor } = tabStates[0];

      if (groupTitle && groupColor) {
        await createTabGroup(groupTitle, tabIds, groupColor, false);
        tabsRestored += tabIds.length;
      }
    }
  }

  tabsRestored += ungroupedTabs.length;

  return tabsRestored;
}
