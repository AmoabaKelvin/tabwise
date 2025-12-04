// Tabwise Service Worker
// Handles extension lifecycle events

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Tabwise installed');
  } else if (details.reason === 'update') {
    console.log('Tabwise updated');
  }
});

// Keep service worker alive (Manifest V3 requirement)
chrome.runtime.onStartup.addListener(() => {
  console.log('Tabwise started');
});
