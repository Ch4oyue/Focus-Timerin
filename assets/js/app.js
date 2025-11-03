import { initializeTheme, toggleTheme, getCurrentTheme } from './theme.js';
import { toggleFullscreen } from './ui.js';

export function initApp({
  menuToggleSelector = '[data-menu-toggle]',
  navLinksSelector = '[data-nav-links]',
  themeToggleSelector = '[data-theme-toggle]',
  fullscreenSelector = '[data-fullscreen-toggle]'
} = {}) {
  initializeTheme();
  setupNavigation(menuToggleSelector, navLinksSelector);
  setupThemeToggle(themeToggleSelector);
  setupFullscreenToggle(fullscreenSelector);
  highlightActiveLink(navLinksSelector);
}

function setupNavigation(toggleSelector, linksSelector) {
  const toggle = document.querySelector(toggleSelector);
  const links = document.querySelector(linksSelector);
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.dataset.open === 'true';
    links.dataset.open = isOpen ? 'false' : 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  links.querySelectorAll('a').forEach(anchor => {
    anchor.addEventListener('click', () => {
      links.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupThemeToggle(selector) {
  const button = document.querySelector(selector);
  if (!button) return;
  button.setAttribute('aria-pressed', getCurrentTheme() === 'light');
  button.addEventListener('click', () => {
    const nextTheme = toggleTheme();
    button.setAttribute('aria-pressed', nextTheme === 'light');
  });
}

function setupFullscreenToggle(selector) {
  const button = document.querySelector(selector);
  if (!button) return;
  button.addEventListener('click', () => toggleFullscreen(button));
}

function highlightActiveLink(linksSelector) {
  const links = document.querySelector(linksSelector);
  if (!links) return;
  const pathname = window.location.pathname.replace(/\/index\.html$/, '/');

  links.querySelectorAll('a').forEach(anchor => {
    const href = anchor.getAttribute('href');
    if (!href) return;
    const target = new URL(href, window.location.href).pathname;
    let isActive = pathname === target || pathname.endsWith(target);
    if (!isActive && target.endsWith('/index.html') && pathname === '/') {
      isActive = true;
    }
    if (isActive) {
      anchor.classList.add('navbar__link--active');
    }
  });
}
