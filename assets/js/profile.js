import { initApp } from './app.js';
import { getUserEmail, loadHistory, loadTasks, saveTasks, clearTimerState, saveHistory } from './storage.js';
import { formatDuration, showNotification } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();

  const emailNode = document.querySelector('#profileEmail');
  const nameNode = document.querySelector('#profileName');
  const avatarNode = document.querySelector('#profileAvatar');
  const tasksNode = document.querySelector('#profileTasks');
  const focusMinutesNode = document.querySelector('#profileFocusMinutes');
  const sessionsNode = document.querySelector('#profileSessions');
  const clearButton = document.querySelector('#clearData');

  const email = getUserEmail();
  const displayName = localStorage.getItem('userDisplayName') || email.split('@')[0] || 'Focus Timerin';
  const tasks = loadTasks();
  const history = loadHistory(email);

  const totalMinutes = history.reduce((sum, session) => sum + (Number(session.durationMinutes) || 0), 0);
  const focusSessions = history.filter(session => session.mode === 'focus').length;

  if (emailNode) emailNode.textContent = email;
  if (nameNode) nameNode.textContent = displayName;
  if (avatarNode) {
    const initials = displayName
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    avatarNode.textContent = initials || 'FT';
  }
  if (tasksNode) tasksNode.textContent = tasks.length;
  if (focusMinutesNode) focusMinutesNode.textContent = formatDuration(totalMinutes);
  if (sessionsNode) sessionsNode.textContent = focusSessions;

  clearButton?.addEventListener('click', () => {
    if (!confirm('Hapus semua data lokal? Tugas, riwayat, dan timer akan direset.')) return;
    saveTasks([]);
    saveHistory([], email);
    clearTimerState();
    localStorage.removeItem('userDisplayName');
    localStorage.removeItem('userEmail');
    showNotification('Data lokal berhasil dihapus.');
    setTimeout(() => window.location.reload(), 600);
  });
});
