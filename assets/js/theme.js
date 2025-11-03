import { loadSettings, saveSettings } from './storage.js';

export function applyTheme(theme, { persist = true } = {}) {
  const body = document.body;
  if (theme === 'light') {
    body.classList.add('theme-light');
  } else {
    body.classList.remove('theme-light');
  }

  if (persist) {
    const settings = loadSettings();
    saveSettings({ ...settings, theme });
  }
}

export function getCurrentTheme() {
  const settings = loadSettings();
  return settings.theme ?? 'dark';
}

export function initializeTheme() {
  const theme = getCurrentTheme();
  applyTheme(theme, { persist: false });
}

export function toggleTheme() {
  const nextTheme = document.body.classList.contains('theme-light') ? 'dark' : 'light';
  applyTheme(nextTheme);
  return nextTheme;
}
