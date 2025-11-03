let notificationNode;
let notificationTimeout;

export function showNotification(message) {
  if (!notificationNode) {
    notificationNode = document.createElement('div');
    notificationNode.className = 'notification';
    document.body.appendChild(notificationNode);
  }

  notificationNode.textContent = message;
  notificationNode.dataset.hidden = 'false';

  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    if (notificationNode) {
      notificationNode.dataset.hidden = 'true';
    }
  }, 2600);
}

export function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const minuteSection = String(minutes).padStart(2, '0');
  const secondSection = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${minuteSection}:${secondSection}`;
  }

  return `${minuteSection}:${secondSection}`;
}

export function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Number(totalMinutes) || 0);
  if (minutes < 60) {
    const rounded = Math.round(minutes * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} menit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = Math.round((minutes % 60) * 10) / 10;
  if (remainder === 0) {
    return `${hours} jam`;
  }

  const remainderText = remainder % 1 === 0 ? remainder.toFixed(0) : remainder.toFixed(1);
  return `${hours} jam ${remainderText} menit`;
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function toggleFullscreen(button) {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      button?.setAttribute('aria-pressed', 'true');
    }).catch(err => console.error('Failed to enable fullscreen', err));
  } else {
    document.exitFullscreen().finally(() => {
      button?.setAttribute('aria-pressed', 'false');
    });
  }
}
