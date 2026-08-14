/**
 * CareConnect — Secure login (demo)
 */

const DEMO_MIN_PASSWORD = 4;

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('open');
    document.getElementById('login-email')?.focus();
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('open');
  const err = document.getElementById('login-error');
  if (err) {
    err.textContent = '';
    err.classList.remove('visible');
  }
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;
  const errorEl = document.getElementById('login-error');

  if (!email || !password || !role) {
    errorEl.textContent = 'Please fill in all fields.';
    errorEl.classList.add('visible');
    return;
  }

  if (password.length < DEMO_MIN_PASSWORD) {
    errorEl.textContent = 'Password must be at least 4 characters.';
    errorEl.classList.add('visible');
    return;
  }

  setStored(STORAGE_KEYS.loggedIn, 'true');
  setStored(STORAGE_KEYS.role, role);

  if (role === 'patient') {
    window.location.href = 'patient.html';
  } else {
    window.location.href = 'provider.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ['open-login', 'hero-login'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', openLoginModal);
  });
  document.getElementById('close-login')?.addEventListener('click', closeLoginModal);
  document.getElementById('login-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'login-modal') closeLoginModal();
  });
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLoginModal();
  });
});
