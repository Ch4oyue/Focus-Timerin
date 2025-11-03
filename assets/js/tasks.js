import { loadTasks, saveTasks } from './storage.js';
import { formatDuration } from './ui.js';

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTask(task) {
  return {
    id: task.id ?? createId(),
    title: task.title ?? 'Tugas tanpa nama',
    estimate: Number.isFinite(task.estimate) ? task.estimate : null,
    completed: Boolean(task.completed),
    active: Boolean(task.active) && !task.completed,
    createdAt: task.createdAt ?? new Date().toISOString()
  };
}

export class TaskManager {
  constructor({ tableBody, summaryNode, onChange }) {
    this.tableBody = tableBody;
    this.summaryNode = summaryNode;
    this.onChange = typeof onChange === 'function' ? onChange : () => {};
    this.tasks = loadTasks().map(normalizeTask);

    if (!this.tasks.some(task => task.active) && this.tasks.some(task => !task.completed)) {
      const firstPending = this.tasks.find(task => !task.completed);
      if (firstPending) {
        firstPending.active = true;
      }
    }

    if (this.tableBody) {
      this.tableBody.addEventListener('click', this.handleTableClick.bind(this));
    }

    this.render();
    this.onChange(this);
  }

  handleTableClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    const row = actionButton.closest('tr');
    const taskId = row?.dataset.id;
    if (!taskId) return;

    if (action === 'complete') {
      this.completeTask(taskId);
    } else if (action === 'activate') {
      this.setActiveTask(taskId);
    } else if (action === 'delete') {
      this.removeTask(taskId);
    }
  }

  persist() {
    saveTasks(this.tasks);
    this.render();
    this.onChange(this);
  }

  render() {
    if (this.tableBody) {
      this.tableBody.innerHTML = '';
      const fragment = document.createDocumentFragment();

      this.tasks.forEach(task => {
        const row = document.createElement('tr');
        row.dataset.id = task.id;
        if (task.active && !task.completed) {
          row.dataset.active = 'true';
        }
        if (task.completed) {
          row.classList.add('completed');
        }

        const estimateText = task.estimate ? formatDuration(task.estimate) : '—';

        const titleCell = document.createElement('td');
        titleCell.textContent = task.title;

        const estimateCell = document.createElement('td');
        estimateCell.textContent = estimateText;

        const statusCell = document.createElement('td');
        const statusChip = document.createElement('span');
        statusChip.classList.add('chip');
        if (task.completed) {
          statusChip.classList.add('tag-success');
          statusChip.textContent = 'Selesai';
        } else if (task.active) {
          statusChip.textContent = 'Sedang dikerjakan';
        } else {
          statusChip.classList.add('tag-muted');
          statusChip.textContent = 'Menunggu';
        }
        statusCell.appendChild(statusChip);

        const actionsCell = document.createElement('td');
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'task-actions';

        if (!task.completed) {
          const completeBtn = document.createElement('button');
          completeBtn.type = 'button';
          completeBtn.dataset.action = 'complete';
          completeBtn.textContent = 'Selesai';
          actionsWrapper.appendChild(completeBtn);
        }

        if (!task.active && !task.completed) {
          const activateBtn = document.createElement('button');
          activateBtn.type = 'button';
          activateBtn.dataset.action = 'activate';
          activateBtn.textContent = 'Jadikan aktif';
          actionsWrapper.appendChild(activateBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.textContent = 'Hapus';
        actionsWrapper.appendChild(deleteBtn);

        actionsCell.appendChild(actionsWrapper);

        row.appendChild(titleCell);
        row.appendChild(estimateCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);

        fragment.appendChild(row);
      });

      this.tableBody.appendChild(fragment);
    }

    this.updateSummary();
  }

  updateSummary() {
    if (!this.summaryNode) return;
    const total = this.tasks.length;
    const completed = this.tasks.filter(task => task.completed).length;
    const activeTask = this.getActiveTask();
    this.summaryNode.innerHTML = '';

    const totalNode = document.createElement('span');
    const totalStrong = document.createElement('strong');
    totalStrong.textContent = String(total);
    totalNode.textContent = 'Total tugas: ';
    totalNode.appendChild(totalStrong);

    const completedNode = document.createElement('span');
    const completedStrong = document.createElement('strong');
    completedStrong.textContent = String(completed);
    completedNode.textContent = 'Selesai: ';
    completedNode.appendChild(completedStrong);

    const activeNode = document.createElement('span');
    const activeStrong = document.createElement('strong');
    activeStrong.textContent = activeTask ? activeTask.title : 'Belum ada';
    activeNode.textContent = 'Aktif: ';
    activeNode.appendChild(activeStrong);

    this.summaryNode.appendChild(totalNode);
    this.summaryNode.appendChild(completedNode);
    this.summaryNode.appendChild(activeNode);
  }

  addTask(title, estimateMinutes) {
    const task = {
      id: createId(),
      title: title.trim(),
      estimate: Number.isFinite(estimateMinutes) && estimateMinutes > 0 ? estimateMinutes : null,
      completed: false,
      active: !this.tasks.some(existing => existing.active && !existing.completed),
      createdAt: new Date().toISOString()
    };

    this.tasks.push(task);
    this.persist();
    return task;
  }

  removeTask(taskId) {
    const index = this.tasks.findIndex(task => task.id === taskId);
    if (index === -1) return;
    const [removed] = this.tasks.splice(index, 1);
    if (removed.active) {
      this.assignNextActive();
    }
    this.persist();
  }

  completeTask(taskId) {
    const task = this.tasks.find(item => item.id === taskId);
    if (!task) return;
    task.completed = true;
    task.active = false;
    this.assignNextActive();
    this.persist();
  }

  assignNextActive() {
    const next = this.tasks.find(item => !item.completed);
    if (next) {
      this.tasks.forEach(task => { task.active = false; });
      next.active = true;
    } else {
      this.tasks.forEach(task => { task.active = false; });
    }
  }

  setActiveTask(taskId) {
    const task = this.tasks.find(item => item.id === taskId && !item.completed);
    if (!task) return;
    this.tasks.forEach(item => { item.active = false; });
    task.active = true;
    this.persist();
  }

  getActiveTask() {
    return this.tasks.find(task => task.active && !task.completed) || null;
  }

  getNextPendingTask() {
    return this.tasks.find(task => !task.completed) || null;
  }

  hasPendingTask() {
    return this.tasks.some(task => !task.completed);
  }

  clearAll() {
    this.tasks = [];
    this.persist();
  }
}
