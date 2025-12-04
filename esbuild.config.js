const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const distDir = 'dist';

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files to dist
function copyStaticFiles() {
  // Copy manifest.json
  fs.copyFileSync('manifest.json', path.join(distDir, 'manifest.json'));

  // Copy popup.html
  fs.copyFileSync('src/popup/popup.html', path.join(distDir, 'popup.html'));

  // Copy popup.css
  fs.copyFileSync('src/popup/popup.css', path.join(distDir, 'popup.css'));

  // Copy icons
  const iconsDir = path.join(distDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const publicIconsDir = 'public/icons';
  if (fs.existsSync(publicIconsDir)) {
    fs.readdirSync(publicIconsDir).forEach(file => {
      fs.copyFileSync(
        path.join(publicIconsDir, file),
        path.join(iconsDir, file)
      );
    });
  }

  console.log('Static files copied to dist/');
}

// Build configuration
const buildOptions = {
  entryPoints: [
    { in: 'src/popup/popup.ts', out: 'popup' },
    { in: 'src/background/service-worker.ts', out: 'service-worker' },
  ],
  bundle: true,
  outdir: distDir,
  format: 'iife',
  target: 'chrome120',
  minify: !isWatch,
  sourcemap: isWatch,
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('Watching for changes...');

      // Initial copy
      copyStaticFiles();

      // Watch for static file changes
      fs.watch('src/popup', (eventType, filename) => {
        if (filename === 'popup.html' || filename === 'popup.css') {
          copyStaticFiles();
        }
      });

      fs.watch('.', (eventType, filename) => {
        if (filename === 'manifest.json') {
          copyStaticFiles();
        }
      });
    } else {
      await esbuild.build(buildOptions);
      copyStaticFiles();
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
