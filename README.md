# Tabwise

A Chrome extension that uses AI to automatically organize your browser tabs into groups.

## Features

- **AI-Powered Organization** - Uses OpenAI models to intelligently group tabs by topic, project, or domain
- **Smart Merge** - Considers existing tab groups and improves organization without losing context
- **Model Selection** - Choose from available OpenAI models via dropdown
- **BYOK** - Bring your own OpenAI API key

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
4. Click "Organize Tabs"

## Development

```bash
bun run watch  # Build with file watching
```

## License

MIT
