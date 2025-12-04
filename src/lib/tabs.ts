import { TabInfo, TabGroup } from '../types';

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
      tab.id !== undefined && tab.id !== chrome.tabs.TAB_ID_NONE
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
  color: chrome.tabGroups.ColorEnum
): Promise<number> {
  if (tabIds.length === 0) return -1;

  const groupId = await chrome.tabs.group({ tabIds });
  await chrome.tabGroups.update(groupId, { title: name, color });

  return groupId;
}

export async function organizeTabsIntoGroups(groups: TabGroup[]): Promise<number> {
  // First, ungroup all existing tabs
  await ungroupAllTabs();

  let groupsCreated = 0;

  // Create each group
  for (const group of groups) {
    if (group.tabIds.length > 0) {
      await createTabGroup(group.name, group.tabIds, group.color);
      groupsCreated++;
    }
  }

  return groupsCreated;
}

export function getTabCount(groups: TabGroup[]): number {
  return groups.reduce((sum, group) => sum + group.tabIds.length, 0);
}
