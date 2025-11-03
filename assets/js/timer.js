import { loadSettings, saveTimerState, loadTimerState } from './storage.js';
import { showNotification, formatTime } from './ui.js';

export class PomodoroTimer {
  constructor({
    displayNode,
    progressCircle,
    startButton,
    modeButtons,
    customToggle,
    customForm,
    customInputs,
    slider,
    countNode,
    audioNode,
    beforeStart = () => true,
    onSessionComplete = () => {},
    onTick = () => {},
    onModeChange = () => {}
  }) {
    this.displayNode = displayNode;
    this.progressCircle = progressCircle;
    this.startButton = startButton;
    this.modeButtons = modeButtons;
    this.customToggle = customToggle;
    this.customForm = customForm;
    this.customInputs = customInputs || {};
    this.slider = slider;
    this.countNode = countNode;
    this.audioNode = audioNode;

    this.beforeStart = beforeStart;
    this.onSessionComplete = onSessionComplete;
    this.onTick = onTick;
    this.onModeChange = onModeChange;

    this.interval = null;
    this.settings = loadSettings();

    this.state = {
      mode: 'focus',
      totalSeconds: this.settings.focusDuration * 60,
      currentSeconds: this.settings.focusDuration * 60,
      isRunning: false,
      focusCount: 0
    };

    this.restoreState();
    this.setupProgressCircle();
    this.attachEvents();
    this.updateModeButtons();
    this.render();
  }

  refreshSettings() {
    this.settings = loadSettings();
  }

  setupProgressCircle() {
    if (!this.progressCircle) return;
    const radius = this.progressCircle.r.baseVal.value;
    this.circumference = 2 * Math.PI * radius;
    this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.updateProgress();
  }

  attachEvents() {
    if (this.startButton) {
      this.startButton.addEventListener('click', () => {
        if (this.state.isRunning) {
          this.pause();
          return;
        }

        if (!this.beforeStart()) {
          return;
        }

        if (this.state.mode === 'focus' && this.state.currentSeconds === this.state.totalSeconds) {
          this.state.focusCount += 1;
          this.updateFocusCount();
        }

        this.start();
      });
    }

    if (this.modeButtons) {
      this.modeButtons.forEach(button => {
        button.addEventListener('click', () => {
          const mode = button.dataset.mode;
          this.setMode(mode);
        });
      });
    }

    if (this.customToggle && this.customForm) {
      this.customToggle.addEventListener('click', () => {
        const isHidden = this.customForm.hasAttribute('hidden');
        if (isHidden) {
          this.populateCustomInputs();
          this.customForm.removeAttribute('hidden');
        } else {
          this.customForm.setAttribute('hidden', '');
        }
      });
    }

    if (this.customForm) {
      this.customForm.addEventListener('submit', event => {
        event.preventDefault();
        const seconds = this.getCustomDurationSeconds();
        if (!Number.isFinite(seconds) || seconds <= 0) {
          showNotification('Waktu khusus harus lebih dari 0 detik.');
          return;
        }
        this.setCustomDuration(seconds);
        this.customForm.setAttribute('hidden', '');
        showNotification('Timer diperbarui dengan waktu kustom.');
      });
    }

    if (this.slider && this.customInputs?.minutes) {
      this.slider.addEventListener('input', () => {
        const minutes = parseInt(this.slider.value, 10) || 0;
        this.customInputs.minutes.value = minutes;
        if (this.customInputs.hours) this.customInputs.hours.value = 0;
        if (this.customInputs.seconds) this.customInputs.seconds.value = 0;
      });
    }

    ['hours', 'minutes', 'seconds'].forEach(key => {
      const input = this.customInputs?.[key];
      if (!input || !this.slider) return;
      input.addEventListener('input', () => {
        const hours = parseInt(this.customInputs.hours?.value ?? '0', 10) || 0;
        const minutes = parseInt(this.customInputs.minutes?.value ?? '0', 10) || 0;
        const seconds = parseInt(this.customInputs.seconds?.value ?? '0', 10) || 0;
        if (hours === 0 && seconds === 0 && minutes >= parseInt(this.slider.min, 10) && minutes <= parseInt(this.slider.max, 10)) {
          this.slider.value = minutes;
        }
      });
    });
  }

  getCustomDurationSeconds() {
    const hours = parseInt(this.customInputs.hours?.value ?? '0', 10) || 0;
    const minutes = parseInt(this.customInputs.minutes?.value ?? '0', 10) || 0;
    const seconds = parseInt(this.customInputs.seconds?.value ?? '0', 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  populateCustomInputs() {
    const total = this.state.currentSeconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (this.customInputs.hours) this.customInputs.hours.value = hours;
    if (this.customInputs.minutes) this.customInputs.minutes.value = minutes;
    if (this.customInputs.seconds) this.customInputs.seconds.value = seconds;
    if (this.slider && minutes >= parseInt(this.slider.min, 10) && minutes <= parseInt(this.slider.max, 10) && hours === 0 && seconds === 0) {
      this.slider.value = minutes;
    }
  }

  restoreState() {
    const stored = loadTimerState();
    if (stored && Number.isFinite(stored.totalSeconds) && stored.totalSeconds > 0) {
      const legacyMode = stored.mode || stored.currentMode || 'focus';
      const legacyCount = Number.isFinite(stored.focusCount) ? stored.focusCount : stored.count;
      this.state = {
        ...this.state,
        ...stored,
        mode: legacyMode,
        focusCount: Number.isFinite(legacyCount) ? legacyCount : this.state.focusCount,
        isRunning: false
      };
      this.updateFocusCount();
    } else {
      this.saveState();
    }
  }

  saveState() {
    saveTimerState({ ...this.state, isRunning: false });
  }

  start() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.state.isRunning = true;
    this.saveState();
    this.interval = setInterval(() => this.tick(), 1000);
    this.updateStartButton();
  }

  pause() {
    clearInterval(this.interval);
    this.interval = null;
    this.state.isRunning = false;
    this.saveState();
    this.updateStartButton();
  }

  tick() {
    if (this.state.currentSeconds <= 0) {
      this.completeSession();
      return;
    }

    this.state.currentSeconds -= 1;
    this.render();
    this.saveState();
    this.onTick({ ...this.state });
  }

  completeSession() {
    clearInterval(this.interval);
    this.interval = null;
    this.state.isRunning = false;
    this.state.currentSeconds = 0;
    this.render();
    this.saveState();

    this.playSound();
    showNotification(`${this.getModeLabel()} selesai!`);

    const payload = {
      mode: this.state.mode,
      durationMinutes: this.state.totalSeconds / 60,
      completedAt: new Date(),
      focusCount: this.state.focusCount
    };

    this.onSessionComplete(payload);

    this.state.currentSeconds = this.state.totalSeconds;
    this.saveState();
    this.updateStartButton();
    this.render();
  }

  playSound() {
    if (!this.audioNode) return;
    try {
      const volume = Math.min(Math.max((this.settings?.soundVolume ?? 80) / 100, 0), 1);
      this.audioNode.volume = volume;
      this.audioNode.currentTime = 0;
      void this.audioNode.play();
    } catch (error) {
      console.warn('Failed to play audio', error);
    }
  }

  getModeLabel() {
    switch (this.state.mode) {
      case 'focus': return 'Sesi fokus';
      case 'short-break': return 'Istirahat pendek';
      case 'long-break': return 'Istirahat panjang';
      case 'custom': return 'Timer kustom';
      default: return 'Timer';
    }
  }

  setMode(mode) {
    if (!mode) return;
    this.refreshSettings();
    this.state.mode = mode;
    this.state.isRunning = false;
    clearInterval(this.interval);

    const durationMinutes = this.getDurationMinutesForMode(mode);
    const seconds = durationMinutes * 60;

    this.state.totalSeconds = seconds;
    this.state.currentSeconds = seconds;

    this.updateModeButtons();
    this.render();
    this.updateStartButton();
    this.saveState();
    this.onModeChange({ mode, durationMinutes });
  }

  setCustomDuration(seconds) {
    this.state.mode = 'custom';
    this.state.totalSeconds = seconds;
    this.state.currentSeconds = seconds;
    this.state.isRunning = false;
    clearInterval(this.interval);
    this.updateModeButtons();
    this.render();
    this.updateStartButton();
    this.saveState();
    this.onModeChange({ mode: 'custom', durationMinutes: Math.round(seconds / 60) });
  }

  getDurationMinutesForMode(mode) {
    switch (mode) {
      case 'focus':
        return this.settings.focusDuration;
      case 'short-break':
        return this.settings.shortBreakDuration;
      case 'long-break':
        return this.settings.longBreakDuration;
      default:
        return Math.max(Math.round(this.state.totalSeconds / 60), 1);
    }
  }

  updateModeButtons() {
    if (!this.modeButtons) return;
    this.modeButtons.forEach(button => {
      const isActive = button.dataset.mode === this.state.mode;
      button.dataset.active = isActive ? 'true' : 'false';
    });
  }

  updateFocusCount() {
    if (this.countNode) {
      this.countNode.textContent = this.state.focusCount;
    }
  }

  updateStartButton() {
    if (!this.startButton) return;
    if (this.state.isRunning) {
      this.startButton.textContent = 'Pause';
    } else if (this.state.currentSeconds === this.state.totalSeconds) {
      this.startButton.textContent = 'Mulai';
    } else {
      this.startButton.textContent = 'Lanjut';
    }
  }

  updateProgress() {
    if (!this.progressCircle || !this.circumference) return;
    const progress = this.state.totalSeconds === 0 ? 0 : (this.state.totalSeconds - this.state.currentSeconds) / this.state.totalSeconds;
    const offset = this.circumference * (1 - progress);
    this.progressCircle.style.strokeDashoffset = `${offset}`;
  }

  render() {
    if (this.displayNode) {
      this.displayNode.textContent = formatTime(this.state.currentSeconds);
    }
    this.updateProgress();
    this.updateFocusCount();
  }
}
