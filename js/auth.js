/** CarePath account login and patient registration. Requires server.py. */
function setError(id, message) { const el = document.getElementById(id); if (el) { el.textContent = message; el.classList.toggle('visible', Boolean(message)); } }
function openModal(id, focusId) { document.getElementById(id)?.classList.add('open'); document.getElementById(focusId)?.focus(); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); setError(id === 'login-modal' ? 'login-error' : 'signup-error', ''); }
function redirectFor(role) { window.location.href = role === 'patient' ? 'patient.html' : role === 'admin' ? 'admin.html' : role === 'site-admin' ? 'site-admin.html' : 'provider.html'; }
async function api(path, body) { const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Something went wrong.'); return result; }
async function handleLogin(event) {
  event.preventDefault(); const email = document.getElementById('login-email').value.trim(); const password = document.getElementById('login-password').value; const role = document.getElementById('login-role').value;
  if (!email || !password || !role) return setError('login-error', 'Please fill in all fields.');
  try { const account = await api('/api/login', { email, password, role }); setStored(STORAGE_KEYS.loggedIn, 'true'); setStored(STORAGE_KEYS.role, account.role); setStored(STORAGE_KEYS.userId, account.userId); setStored(STORAGE_KEYS.userName, account.name); setStored(STORAGE_KEYS.hospitalId, account.hospitalId || ''); setStored(STORAGE_KEYS.sessionToken, account.sessionToken); redirectFor(account.role); } catch (error) { setError('login-error', `${error.message} Start the CarePath server before signing in.`); }
}
async function loadHospitals() {
  const select = document.getElementById('signup-hospital'); if (!select) return;
  try { const response = await fetch('/api/hospitals'); const hospitals = await response.json(); select.innerHTML = '<option value="">Select a facility…</option>' + hospitals.map((hospital) => `<option value="${hospital.id}">${hospital.name}</option>`).join(''); } catch { select.innerHTML = '<option value="">Server unavailable</option>'; }
}
async function loadDoctors() {
  const hospitalId = document.getElementById('signup-hospital')?.value;
  const select = document.getElementById('signup-doctor');
  if (!select) return;
  select.disabled = true;
  select.innerHTML = '<option value="">Loading doctors…</option>';
  if (!hospitalId) { select.innerHTML = '<option value="">Select a hospital first…</option>'; return; }
  try {
    const response = await fetch(`/api/doctors?hospitalId=${encodeURIComponent(hospitalId)}`);
    const doctors = await response.json();
    select.innerHTML = '<option value="">Select your main doctor…</option>' + doctors.map((doctor) => `<option value="${doctor.id}">${doctor.name} — ${doctor.specialty}</option>`).join('');
    select.disabled = false;
  } catch { select.innerHTML = '<option value="">Doctors unavailable</option>'; }
}
async function handleSignup(event) {
  event.preventDefault(); const value = (id) => document.getElementById(id).value.trim();
  try { const account = await api('/api/signup', { name: value('signup-name'), email: value('signup-email'), password: document.getElementById('signup-password').value, dateOfBirth: value('signup-dob'), gender: value('signup-gender'), healthCard: value('signup-health-card'), phone: value('signup-phone'), hospitalId: value('signup-hospital'), doctorId: value('signup-doctor'), emergencyName: value('signup-emergency-name'), emergencyRelationship: value('signup-emergency-relationship'), emergencyPhone: value('signup-emergency-phone') }); setStored(STORAGE_KEYS.loggedIn, 'true'); setStored(STORAGE_KEYS.role, account.role); setStored(STORAGE_KEYS.userId, account.patientId); setStored(STORAGE_KEYS.userName, account.name); setStored(STORAGE_KEYS.hospitalId, value('signup-hospital')); setStored(STORAGE_KEYS.sessionToken, account.sessionToken); redirectFor('patient'); } catch (error) { setError('signup-error', `${error.message} Start the CarePath server before creating an account.`); }
}
document.addEventListener('DOMContentLoaded', () => {
  ['open-login', 'hero-login'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => openModal('login-modal', 'login-email')));
  ['open-signup', 'hero-signup'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => { closeModal('login-modal'); openModal('signup-modal', 'signup-name'); loadHospitals(); }));
  document.getElementById('close-login')?.addEventListener('click', () => closeModal('login-modal')); document.getElementById('close-signup')?.addEventListener('click', () => closeModal('signup-modal'));
  ['login-modal', 'signup-modal'].forEach((id) => document.getElementById(id)?.addEventListener('click', (event) => { if (event.target.id === id) closeModal(id); }));
  document.getElementById('login-form')?.addEventListener('submit', handleLogin); document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
  document.getElementById('signup-hospital')?.addEventListener('change', loadDoctors);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeModal('login-modal'); closeModal('signup-modal'); } });
});
