import { initializeTheme } from './theme.js';

function handleAuthForm(form) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = (formData.get('email') ?? '').toString().trim();
    const name = (formData.get('displayName') ?? '').toString().trim();
    if (!email) {
      alert('Masukkan email terlebih dahulu.');
      return;
    }
    localStorage.setItem('userEmail', email);
    if (name) {
      localStorage.setItem('userDisplayName', name);
    }
    alert('Data login tersimpan secara lokal. Kamu dapat kembali ke beranda.');
    const redirect = form.dataset.redirect || '../../index.html';
    window.location.href = new URL(redirect, window.location.href).toString();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  const form = document.querySelector('[data-auth-form]');
  if (form) handleAuthForm(form);
});
