export const SETTINGS_KEY = 'focusTimerSettings';
export const TIMER_STATE_KEY = 'focusTimerState';
export const TASKS_KEY = 'focusTimerTasks';
export const HISTORY_PREFIX = 'focusHistory_';

export const defaultSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  soundVolume: 80,
  theme: 'dark',
  notificationSound: 'session-complete'
};

export function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...defaultSettings };
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn('Failed to parse settings, resetting to default', error);
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadTimerState() {
  const raw = localStorage.getItem(TIMER_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse timer state', error);
    return null;
  }
}

export function saveTimerState(state) {
  localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
}

export function clearTimerState() {
  localStorage.removeItem(TIMER_STATE_KEY);
}

export function getUserEmail() {
  const email = localStorage.getItem('userEmail');
  return email && email.trim().length > 0 ? email : 'guest';
}

export function getHistoryKey(email = getUserEmail()) {
  return `${HISTORY_PREFIX}${email.replace(/[^\w]/g, '')}`;
}

export function loadHistory(email) {
  const raw = localStorage.getItem(getHistoryKey(email));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse history data', error);
    return [];
  }
}

export function saveHistory(history, email) {
  localStorage.setItem(getHistoryKey(email), JSON.stringify(history));
}

export function appendHistory(entry, email) {
  const history = loadHistory(email);
  history.unshift(entry);
  saveHistory(history, email);
}

export function loadTasks() {
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (error) {
    console.warn('Failed to parse tasks data', error);
    return [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
