# Tabwise

A Chrome extension that uses AI to automatically organize your browser tabs into groups.

## Features

- **AI-Powered Organization** - Uses OpenAI models to intelligently group tabs by topic, project, or domain
- **Smart Merge** - Considers existing tab groups and improves organization without losing context
- **Model Selection** - Choose from available OpenAI models via dropdown
- **BYOK** - Bring your own OpenAI API key
- **Keyboard Shortcut** - Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) to organize tabs instantly without opening the popup
- **Undo** - Restore your previous tab arrangement with one click
- **Auto-Organize** - Automatically organize tabs when ungrouped tabs exceed a configurable threshold
- **Auto-Collapse Groups** - Keeps your tab bar clean by collapsing all groups except the active one
- **Dark Mode** - Follows your system preference for light/dark theme
- **Background Processing** - Organization continues even if you close the popup
- **Pinned Tabs Excluded** - Pinned tabs are never moved or grouped

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/AmoabaKelvin/tabwise.git
   cd tabwise
   ```

2. Install dependencies
   ```bash
   bun install
   ```

3. Build the extension
   ```bash
   bun run build
   ```

4. Load in Chrome
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Usage

1. Click the Tabwise extension icon
2. Enter your OpenAI API key and click Save
3. Select your preferred model from the dropdown
4. Click "Organize Tabs" or use the keyboard shortcut `Ctrl+Shift+O` (`Cmd+Shift+O` on Mac)

### Settings

- **Auto-organize**: Enable to automatically organize tabs when ungrouped tabs exceed your set threshold
- **Undo**: Click "Undo" to restore your previous tab arrangement

## Development

```bash
bun run watch  # Build with file watching
```

## License

MIT
