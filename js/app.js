/**
 * CarePath shared utilities: themes, accessibility, and text to speech.
 * This file is loaded by every page.
 */

// Names of the local storage keys used across the whole site.
const STORAGE_KEYS = {
  theme: 'carepath-theme',
  role: 'carepath-role',
  loggedIn: 'carepath-logged-in',
  userId: 'carepath-user-id',
  userName: 'carepath-user-name',
  hospitalId: 'carepath-hospital-id',
  sessionToken: 'carepath-session-token',
};

// Reads a value from local storage, returning the fallback if it is missing
// or if storage is blocked by the browser.
function getStored(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

// Saves a value to local storage, ignoring errors if storage is blocked.
function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/* ---------- Theme ---------- */

// Applies the light or dark theme to the page and updates the toggle button.
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setStored(STORAGE_KEYS.theme, theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
}

// Switches between the light and dark themes.
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ---------- Text to speech ---------- */

// Reads the given text out loud using the browser's speech feature.
// Disables the button while speaking so it cannot be clicked twice.
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

// Finds every button marked with data-tts and makes it read its target
// element's text out loud when clicked.
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

// Builds the small colored badge HTML used to show a status label.
function statusBadge(type, label) {
  const cls = type === 'open' ? 'status-open' : type === 'pending' ? 'status-pending' : 'status-resolved';
  return `<span class="status-badge ${cls}">${label}</span>`;
}

/* ---------- Autocomplete ---------- */

// Turns a text input into a simple autocomplete. As the user types,
// a list of up to eight matching options appears below the input.
function initAutocomplete(inputEl, listEl, options) {
  if (!inputEl || !listEl) return;

  // Shows the options that match the typed text, or hides the list.
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

  // Clicking an option copies it into the input and closes the list.
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (btn) {
      inputEl.value = btn.getAttribute('data-value');
      listEl.classList.remove('open');
    }
  });

  // Clicking anywhere else on the page closes the list.
  document.addEventListener('click', (e) => {
    if (!inputEl.contains(e.target) && !listEl.contains(e.target)) {
      listEl.classList.remove('open');
    }
  });
}

/* ---------- Auth guard ---------- */

// Blocks a page from users who are not logged in with the required role.
// Anyone else is sent back to the home page.
function requireAuth(role) {
  const loggedIn = getStored(STORAGE_KEYS.loggedIn, '') === 'true';
  const storedRole = getStored(STORAGE_KEYS.role, '');
  if (!loggedIn || storedRole !== role) {
    window.location.href = 'index.html';
  }
}

// Signs the user out on the server, clears the saved session details,
// and returns to the home page.
async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` } });
  } catch { /* Local sign-out still completes if the server is unavailable. */ }
  setStored(STORAGE_KEYS.loggedIn, 'false');
  setStored(STORAGE_KEYS.role, '');
  setStored(STORAGE_KEYS.hospitalId, '');
  setStored(STORAGE_KEYS.sessionToken, '');
  window.location.href = 'index.html';
}

/* ---------- Init shared UI ---------- */

// Sets up the parts of the page that every screen shares: the saved theme,
// the theme toggle, the logout button, and the read-aloud buttons.
function initAccessibilityToolbar() {
  applyTheme(getStored(STORAGE_KEYS.theme, 'light'));

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  bindTtsButtons();
}

document.addEventListener('DOMContentLoaded', initAccessibilityToolbar);
