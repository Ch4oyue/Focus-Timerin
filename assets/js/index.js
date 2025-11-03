import { initApp } from './app.js';
import { PomodoroTimer } from './timer.js';
import { TaskManager } from './tasks.js';
import { showNotification, formatDateTime } from './ui.js';
import { appendHistory, getUserEmail } from './storage.js';

function modeLabel(mode) {
  switch (mode) {
    case 'focus': return 'Fokus';
    case 'short-break': return 'Istirahat pendek';
    case 'long-break': return 'Istirahat panjang';
    case 'custom': return 'Kustom';
    default: return 'Timer';
  }
}

const quotes = [
  { text: 'Produktivitas bukan tentang melakukan lebih banyak, tetapi tentang fokus pada hal yang paling berdampak.', author: 'Gary Keller' },
  { text: 'Kunci keberhasilan adalah fokus pikiran kita pada hal-hal yang kita inginkan, bukan pada hal-hal yang kita takuti.', author: 'Brian Tracy' },
  { text: 'Jika kamu mengejar dua kelinci, kamu tidak akan mendapatkan salah satunya.', author: 'Pepatah Rusia' },
  { text: 'Disiplin diri adalah bentuk tertinggi dari cinta terhadap dirimu sendiri.', author: 'Unknown' },
  { text: 'Mulailah dengan melakukan apa yang perlu dilakukan; kemudian lakukan apa yang mungkin; dan tiba-tiba kamu melakukan hal yang mustahil.', author: 'Fransiskus dari Assisi' },
  { text: 'Fokus adalah tentang mengatakan tidak.', author: 'Steve Jobs' }
];

function setRandomQuote() {
  const quoteText = document.querySelector('#quoteText');
  const quoteAuthor = document.querySelector('#quoteAuthor');
  if (!quoteText || !quoteAuthor) return;
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  quoteText.textContent = `“${random.text}”`;
  quoteAuthor.textContent = `— ${random.author}`;
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setRandomQuote();

  const activeTaskTitle = document.querySelector('#activeTaskTitle');
  const activeModeLabel = document.querySelector('#activeMode');
  const lastSessionNode = document.querySelector('#lastSession');
  const taskForm = document.querySelector('#taskForm');
  const taskNameInput = document.querySelector('#taskName');
  const taskEstimateInput = document.querySelector('#taskEstimate');

  const email = getUserEmail();

  const taskManager = new TaskManager({
    tableBody: document.querySelector('#taskTable tbody'),
    summaryNode: document.querySelector('#taskSummary'),
    onChange: () => updateActiveTaskDisplay()
  });

  function updateActiveTaskDisplay() {
    const activeTask = taskManager.getActiveTask();
    if (activeTaskTitle) {
      activeTaskTitle.textContent = activeTask ? activeTask.title : 'Belum ada tugas aktif';
    }
  }

  updateActiveTaskDisplay();

  if (taskForm) {
    taskForm.addEventListener('submit', event => {
      event.preventDefault();
      const title = taskNameInput?.value?.trim();
      const estimate = parseInt(taskEstimateInput?.value ?? '', 10);
      if (!title) {
        showNotification('Masukkan nama tugas terlebih dahulu.');
        return;
      }
      taskManager.addTask(title, Number.isFinite(estimate) ? estimate : null);
      taskForm.reset();
      updateActiveTaskDisplay();
      showNotification('Tugas baru ditambahkan.');
    });
  }

  const timer = new PomodoroTimer({
    displayNode: document.querySelector('[data-timer-display]'),
    progressCircle: document.querySelector('[data-progress-circle]'),
    startButton: document.querySelector('[data-start-button]'),
    modeButtons: document.querySelectorAll('[data-mode]'),
    customToggle: document.querySelector('[data-custom-toggle]'),
    customForm: document.querySelector('[data-custom-form]'),
    customInputs: {
      hours: document.querySelector('#customHours'),
      minutes: document.querySelector('#customMinutes'),
      seconds: document.querySelector('#customSeconds')
    },
    slider: document.querySelector('#timeSlider'),
    countNode: document.querySelector('#focusCount'),
    audioNode: document.querySelector('#endSound'),
    beforeStart: () => {
      if (!taskManager.hasPendingTask()) {
        showNotification('Tambahkan minimal satu tugas untuk memulai.');
        return false;
      }
      const activeTask = taskManager.getActiveTask() || taskManager.getNextPendingTask();
      if (activeTask) {
        taskManager.setActiveTask(activeTask.id);
        updateActiveTaskDisplay();
      }
      return true;
    },
    onSessionComplete: ({ mode, durationMinutes, completedAt }) => {
      const activeTask = taskManager.getActiveTask();
      if (mode === 'focus' && activeTask) {
        taskManager.completeTask(activeTask.id);
      }

      appendHistory({
        id: `${Date.now()}`,
        date: completedAt.toISOString(),
        task: activeTask?.title ?? 'Sesi tanpa tugas',
        mode,
        durationMinutes
      }, email);

      if (lastSessionNode) {
        const formatted = formatDateTime(completedAt);
        lastSessionNode.textContent = `${modeLabel(mode)} selesai pada ${formatted}`;
      }
    },
    onModeChange: ({ mode }) => {
      if (activeModeLabel) {
        activeModeLabel.textContent = modeLabel(mode);
      }
    }
  });

  if (activeModeLabel && timer?.state) {
    activeModeLabel.textContent = modeLabel(timer.state.mode);
  }
});
