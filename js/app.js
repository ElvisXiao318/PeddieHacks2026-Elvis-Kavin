/**
 * CareConnect — Shared utilities: themes, accessibility, text-to-speech
 */

const STORAGE_KEYS = {
  theme: 'careconnect-theme',
  role: 'careconnect-role',
  loggedIn: 'careconnect-logged-in',
};

function getStored(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/* ---------- Theme ---------- */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setStored(STORAGE_KEYS.theme, theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ---------- Text to speech ---------- */

function speakText(text, btn) {
  if (!('speechSynthesis' in window)) {
    alert('Text-to-speech is not supported in this browser.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-CA';
  if (btn) {
    btn.disabled = true;
    utterance.onend = () => { btn.disabled = false; };
    utterance.onerror = () => { btn.disabled = false; };
  }
  window.speechSynthesis.speak(utterance);
}

function bindTtsButtons() {
  document.querySelectorAll('[data-tts]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tts');
      const el = document.getElementById(targetId);
      if (el) speakText(el.innerText.trim(), btn);
    });
  });
}

/* ---------- Status badge helper ---------- */

function statusBadge(type, label) {
  const cls = type === 'open' ? 'status-open' : type === 'pending' ? 'status-pending' : 'status-resolved';
  return `<span class="status-badge ${cls}">${label}</span>`;
}

/* ---------- Autocomplete ---------- */

function initAutocomplete(inputEl, listEl, options) {
  if (!inputEl || !listEl) return;

  function render(filter) {
    const q = filter.toLowerCase();
    const matches = options.filter((o) => o.toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length || !q) {
      listEl.classList.remove('open');
      listEl.innerHTML = '';
      return;
    }
    listEl.innerHTML = matches
      .map((m) => `<button type="button" data-value="${m}">${m}</button>`)
      .join('');
    listEl.classList.add('open');
  }

  inputEl.addEventListener('input', () => render(inputEl.value));
  inputEl.addEventListener('focus', () => render(inputEl.value));

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (btn) {
      inputEl.value = btn.getAttribute('data-value');
      listEl.classList.remove('open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!inputEl.contains(e.target) && !listEl.contains(e.target)) {
      listEl.classList.remove('open');
    }
  });
}

/* ---------- Auth guard ---------- */

function requireAuth(role) {
  const loggedIn = getStored(STORAGE_KEYS.loggedIn, '') === 'true';
  const storedRole = getStored(STORAGE_KEYS.role, '');
  if (!loggedIn || storedRole !== role) {
    window.location.href = 'index.html';
  }
}

function logout() {
  setStored(STORAGE_KEYS.loggedIn, 'false');
  setStored(STORAGE_KEYS.role, '');
  window.location.href = 'index.html';
}

/* ---------- Init shared UI ---------- */

function initAccessibilityToolbar() {
  applyTheme(getStored(STORAGE_KEYS.theme, 'light'));

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  bindTtsButtons();
}

document.addEventListener('DOMContentLoaded', initAccessibilityToolbar);
