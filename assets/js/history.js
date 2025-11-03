import { initApp } from './app.js';
import { loadHistory, getUserEmail } from './storage.js';
import { formatDateTime, formatDuration } from './ui.js';

function modeLabel(mode) {
  switch (mode) {
    case 'focus':
      return 'Fokus';
    case 'short-break':
      return 'Istirahat pendek';
    case 'long-break':
      return 'Istirahat panjang';
    case 'custom':
      return 'Kustom';
    default:
      return 'Tidak diketahui';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();

  const listNode = document.querySelector('#historyList');
  const emptyNode = document.querySelector('#historyEmpty');
  const statsNode = document.querySelector('#historyStats');

  const history = loadHistory(getUserEmail());

  if (!history || history.length === 0) {
    if (emptyNode) emptyNode.removeAttribute('hidden');
    return;
  }

  if (emptyNode) emptyNode.setAttribute('hidden', '');

  const fragment = document.createDocumentFragment();
  let totalMinutes = 0;
  let focusSessions = 0;

  history.forEach(entry => {
    const minutes = Number(entry.durationMinutes) || 0;
    totalMinutes += minutes;
    if (entry.mode === 'focus') focusSessions += 1;

    const item = document.createElement('article');
    item.className = 'history-item';
    const formattedDate = entry.date ? formatDateTime(new Date(entry.date)) : '—';
    const label = entry.task || 'Sesi tanpa tugas';
    const modeText = modeLabel(entry.mode);

    const infoWrapper = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = label;

    const meta = document.createElement('div');
    meta.className = 'history-item__meta';
    const modeSpan = document.createElement('span');
    modeSpan.textContent = modeText;
    const durationSpan = document.createElement('span');
    durationSpan.textContent = formatDuration(minutes);
    meta.appendChild(modeSpan);
    meta.appendChild(durationSpan);

    infoWrapper.appendChild(title);
    infoWrapper.appendChild(meta);

    const dateWrapper = document.createElement('div');
    dateWrapper.className = 'history-item__meta';
    const dateSpan = document.createElement('span');
    dateSpan.textContent = formattedDate;
    dateWrapper.appendChild(dateSpan);

    item.appendChild(infoWrapper);
    item.appendChild(dateWrapper);

    fragment.appendChild(item);
  });

  listNode?.appendChild(fragment);

  if (statsNode) {
    const totalSessions = history.length;
    statsNode.innerHTML = `
      <span>Total sesi: <strong>${totalSessions}</strong></span>
      <span>Sesi fokus: <strong>${focusSessions}</strong></span>
      <span>Total waktu: <strong>${formatDuration(totalMinutes)}</strong></span>
    `;
  }
});
