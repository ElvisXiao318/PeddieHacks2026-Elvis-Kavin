/**
 * CareConnect — Shared utilities: themes, accessibility, speech
 */

const STORAGE_KEYS = {
  theme: 'careconnect-theme',
  colorblind: 'careconnect-colorblind',
  sideways: 'careconnect-sideways',
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
    btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ---------- Colorblind textures ---------- */

function applyColorblind(enabled) {
  document.documentElement.setAttribute('data-colorblind', enabled ? 'true' : 'false');
  setStored(STORAGE_KEYS.colorblind, enabled ? 'true' : 'false');
  const btn = document.getElementById('colorblind-toggle');
  if (btn) {
    btn.classList.toggle('active', enabled);
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }
}

function toggleColorblind() {
  const current = document.documentElement.getAttribute('data-colorblind') === 'true';
  applyColorblind(!current);
}

/* ---------- Sideways mode ---------- */

function applySideways(enabled) {
  document.body.classList.toggle('sideways-mode', enabled);
  setStored(STORAGE_KEYS.sideways, enabled ? 'true' : 'false');
  const btn = document.getElementById('sideways-toggle');
  if (btn) {
    btn.classList.toggle('active', enabled);
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }
}

function toggleSideways() {
  applySideways(!document.body.classList.contains('sideways-mode'));
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

/* ---------- Speech to text ---------- */

let activeRecognition = null;

function startSpeechToText(inputEl, statusEl, btn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech-to-text is not supported in this browser.');
    return;
  }

  if (activeRecognition) {
    activeRecognition.stop();
    activeRecognition = null;
    if (statusEl) statusEl.textContent = '';
    if (btn) btn.textContent = '🎤 Speak';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-CA';
  recognition.interimResults = true;
  recognition.continuous = false;
  activeRecognition = recognition;

  if (statusEl) statusEl.textContent = 'Listening…';
  if (btn) btn.textContent = '⏹ Stop';

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (inputEl) {
      const existing = inputEl.value.trim();
      inputEl.value = existing ? `${existing} ${transcript}` : transcript;
    }
  };

  recognition.onend = () => {
    activeRecognition = null;
    if (statusEl) statusEl.textContent = '';
    if (btn) btn.textContent = '🎤 Speak';
  };

  recognition.onerror = () => {
    activeRecognition = null;
    if (statusEl) statusEl.textContent = '';
    if (btn) btn.textContent = '🎤 Speak';
  };

  recognition.start();
}

function bindSttButtons() {
  document.querySelectorAll('[data-stt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const inputId = btn.getAttribute('data-stt');
      const inputEl = document.getElementById(inputId);
      const statusEl = btn.parentElement?.querySelector('.listening');
      startSpeechToText(inputEl, statusEl, btn);
    });
  });
}

/* ---------- Status badge helper ---------- */

function statusBadge(type, label) {
  const cls = type === 'open' ? 'status-open' : type === 'pending' ? 'status-pending' : 'status-resolved';
  return `<span class="status-badge ${cls}"><span class="texture" aria-hidden="true"></span>${label}</span>`;
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
  applyColorblind(getStored(STORAGE_KEYS.colorblind, 'false') === 'true');
  applySideways(getStored(STORAGE_KEYS.sideways, 'false') === 'true');

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('colorblind-toggle')?.addEventListener('click', toggleColorblind);
  document.getElementById('sideways-toggle')?.addEventListener('click', toggleSideways);
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  bindTtsButtons();
  bindSttButtons();
}

document.addEventListener('DOMContentLoaded', initAccessibilityToolbar);
