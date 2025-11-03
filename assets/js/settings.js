import { initApp } from './app.js';
import { defaultSettings, loadSettings, saveSettings } from './storage.js';
import { applyTheme } from './theme.js';
import { showNotification } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();

  const form = document.querySelector('#settingsForm');
  const focusInput = document.querySelector('#focusDuration');
  const shortInput = document.querySelector('#shortBreakDuration');
  const longInput = document.querySelector('#longBreakDuration');
  const volumeInput = document.querySelector('#soundVolume');
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const resetButton = document.querySelector('#resetSettings');

  function hydrate() {
    const settings = loadSettings();
    if (focusInput) focusInput.value = settings.focusDuration;
    if (shortInput) shortInput.value = settings.shortBreakDuration;
    if (longInput) longInput.value = settings.longBreakDuration;
    if (volumeInput) volumeInput.value = settings.soundVolume;
    themeRadios.forEach(radio => {
      radio.checked = radio.value === settings.theme;
    });
  }

  hydrate();

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const settings = {
      focusDuration: Math.min(Math.max(parseInt(focusInput?.value ?? '25', 10) || 25, 1), 180),
      shortBreakDuration: Math.min(Math.max(parseInt(shortInput?.value ?? '5', 10) || 5, 1), 60),
      longBreakDuration: Math.min(Math.max(parseInt(longInput?.value ?? '15', 10) || 15, 5), 120),
      soundVolume: Math.min(Math.max(parseInt(volumeInput?.value ?? '80', 10) || 80, 0), 100),
      theme: [...themeRadios].find(radio => radio.checked)?.value ?? defaultSettings.theme,
      notificationSound: 'session-complete'
    };
    saveSettings(settings);
    applyTheme(settings.theme, { persist: false });
    showNotification('Pengaturan berhasil disimpan.');
  });

  resetButton?.addEventListener('click', () => {
    saveSettings({ ...defaultSettings });
    hydrate();
    applyTheme(defaultSettings.theme, { persist: false });
    showNotification('Pengaturan dikembalikan ke bawaan.');
  });
});
