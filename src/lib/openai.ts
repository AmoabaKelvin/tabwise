import { TabInfo, OrganizeResponse, OpenAIRequest, OpenAIResponse } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a browser tab organizer. Given a list of browser tabs with their titles, URLs, and current group assignments, reorganize them into logical groups.

Rules:
- Create concise, descriptive group names (1-3 words max)
- Use appropriate colors from: grey, blue, red, yellow, green, pink, purple, cyan, orange
- Group tabs by topic, project, or domain
- Every tab must be assigned to exactly one group
- Aim for 2-6 groups depending on tab diversity
- If tabs are very similar, use fewer groups
- If tabs are diverse, use more groups
- Consider existing group assignments: keep well-organized groups, merge or split as needed
- If a tab's current group makes sense, you can keep it there
- Feel free to rename groups for clarity or merge similar ones

Return the groups with the exact tab IDs provided.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Short, descriptive name for the group (1-3 words)',
          },
          color: {
            type: 'string',
            enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
            description: 'Tab group color',
          },
          tabIds: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of tab IDs belonging to this group',
          },
        },
        required: ['name', 'color', 'tabIds'],
        additionalProperties: false,
      },
    },
  },
  required: ['groups'],
  additionalProperties: false,
};

function formatTabsForPrompt(tabs: TabInfo[]): string {
  return tabs
    .map(tab => {
      const groupInfo = tab.groupName ? `, Current Group: "${tab.groupName}"` : ', Current Group: none';
      return `- ID: ${tab.id}, Title: "${tab.title}", URL: ${tab.url}${groupInfo}`;
    })
    .join('\n');
}

export async function organizeWithAI(
  apiKey: string,
  tabs: TabInfo[],
  model: string
): Promise<OrganizeResponse> {
  if (tabs.length === 0) {
    return { groups: [] };
  }

  const hasExistingGroups = tabs.some(tab => tab.groupName);
  const intro = hasExistingGroups
    ? `Please reorganize these ${tabs.length} browser tabs. Some are already grouped - keep good groupings, improve or merge others as needed:`
    : `Please organize these ${tabs.length} browser tabs into groups:`;
  const userMessage = `${intro}\n\n${formatTabsForPrompt(tabs)}`;

  const request: OpenAIRequest = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'tab_groups',
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.error?.message || `API error: ${response.status}`;
    throw new Error(message);
  }

  const data: OpenAIResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const result: OrganizeResponse = JSON.parse(content);

  // Validate all tab IDs exist
  const validTabIds = new Set(tabs.map(t => t.id));
  for (const group of result.groups) {
    group.tabIds = group.tabIds.filter(id => validTabIds.has(id));
  }

  // Remove empty groups
  result.groups = result.groups.filter(g => g.tabIds.length > 0);

  return result;
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
