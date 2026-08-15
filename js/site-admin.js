/**
 * CarePath — Site admin dashboard
 *
 * The site admin is the only role that can add or remove hospitals,
 * doctors, specialists, and hospital admins. None of those roles can
 * sign themselves up.
 */

requireAuth('site-admin');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function authHeader() {
  return { Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` };
}

function setMessage(id, text, success = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  el.style.color = success ? 'var(--success)' : 'var(--danger)';
}

// ─── Panel navigation ─────────────────────────────────────────────────────────

function showPanel(panelId) {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-panel') === panelId);
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${panelId}`);
  });
  if (panelId === 'hospitals') loadHospitalsList();
  if (panelId === 'directory') refreshDirectory();
}

function initPanels() {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => showPanel(btn.getAttribute('data-panel')));
  });
}

// ─── Load hospitals into a <select> ──────────────────────────────────────────

async function fetchHospitals() {
  const response = await fetch('/api/hospitals');
  if (!response.ok) throw new Error('Could not load hospitals.');
  return response.json();
}

async function populateHospitalSelect(selectId, includeBlank = true) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const hospitals = await fetchHospitals();
    select.innerHTML =
      (includeBlank ? '<option value="">Select a hospital…</option>' : '') +
      hospitals.map((h) => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join('');
  } catch {
    select.innerHTML = '<option value="">Hospitals unavailable</option>';
  }
}

// ─── Add record form ──────────────────────────────────────────────────────────

function initProvisionForm() {
  const typeSelect = document.getElementById('site-admin-type');
  const staffFields = document.querySelectorAll('.provision-staff-field');
  const hospitalOnlyFields = document.querySelectorAll('.provision-hospital-only');

  function updateFields() {
    const isHospital = typeSelect.value === 'hospital';
    staffFields.forEach((f) => (f.style.display = isHospital ? 'none' : ''));
    hospitalOnlyFields.forEach((f) => (f.style.display = isHospital ? '' : 'none'));
    document.getElementById('site-admin-email').required = !isHospital;
    document.getElementById('site-admin-password').required = !isHospital;
    document.getElementById('site-admin-hospital').required = !isHospital;
  }

  typeSelect?.addEventListener('change', updateFields);
  updateFields();

  populateHospitalSelect('site-admin-hospital');

  document.getElementById('site-admin-provision-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = (id) => document.getElementById(id)?.value.trim() ?? '';
    const type = value('site-admin-type');
    const isHospital = type === 'hospital';

    const body = {
      type,
      name: value('site-admin-name-field'),
      ...(isHospital
        ? { address: value('site-admin-address'), phone: value('site-admin-hosp-phone') }
        : {
            hospitalId: value('site-admin-hospital'),
            specialty: value('site-admin-specialty'),
            email: value('site-admin-email'),
            password: document.getElementById('site-admin-password').value,
            phone: value('site-admin-phone'),
          }),
    };

    try {
      const response = await fetch('/api/admin/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage('site-admin-message', result.message, true);
      event.target.reset();
      updateFields();
      // Refresh hospital dropdowns if a hospital was just added
      if (isHospital) {
        populateHospitalSelect('site-admin-hospital');
        populateHospitalSelect('directory-hospital', true);
      }
    } catch (error) {
      setMessage('site-admin-message', error.message || 'Could not add this record.');
    }
  });
}

// ─── Hospitals list panel ─────────────────────────────────────────────────────

async function loadHospitalsList() {
  const el = document.getElementById('hospitals-list');
  if (!el) return;

  try {
    const hospitals = await fetchHospitals();
    if (!hospitals.length) {
      el.innerHTML = '<div class="empty-state"><p>No hospitals have been added yet.</p></div>';
      return;
    }

    el.innerHTML = hospitals
      .map(
        (h) => `
        <article class="appointment-item">
          <div class="appointment-details">
            <p class="section-kicker">Hospital</p>
            <h3>${escapeHtml(h.name)}</h3>
            <p>${escapeHtml(h.address || 'No address on file')}</p>
          </div>
          <div class="appointment-status">
            <button
              type="button"
              class="btn btn-sm"
              style="color:var(--danger);border-color:var(--danger);"
              data-remove-type="hospital"
              data-remove-id="${h.id}"
              data-remove-name="${escapeHtml(h.name)}"
            >Remove</button>
          </div>
        </article>
      `,
      )
      .join('');
  } catch {
    el.innerHTML = '<div class="empty-state"><p>Could not load hospitals.</p></div>';
  }
}

// ─── Staff directory panel ────────────────────────────────────────────────────

function staffRowMarkup(person, roleLabel, type) {
  return `
    <article class="appointment-item">
      <div class="appointment-details">
        <p class="section-kicker">${escapeHtml(roleLabel)}${person.specialty ? ` · ${escapeHtml(person.specialty)}` : ''}</p>
        <h3>${escapeHtml(person.name)}</h3>
        <p>${escapeHtml(person.email || 'No email on file')}</p>
      </div>
      <div class="appointment-status">
        <button
          type="button"
          class="btn btn-sm"
          style="color:var(--danger);border-color:var(--danger);"
          data-remove-type="${type}"
          data-remove-id="${person.id}"
          data-remove-name="${escapeHtml(person.name)}"
        >Remove</button>
      </div>
    </article>
  `;
}

async function refreshDirectory() {
  const hospitalId = document.getElementById('directory-hospital')?.value;
  const doctorsEl = document.getElementById('directory-doctors');
  const specialistsEl = document.getElementById('directory-specialists');
  const adminsEl = document.getElementById('directory-admins');

  const empty = (msg) => `<div class="empty-state"><p>${msg}</p></div>`;

  if (!hospitalId) {
    if (doctorsEl) doctorsEl.innerHTML = empty('Select a hospital to see its staff.');
    if (specialistsEl) specialistsEl.innerHTML = '';
    if (adminsEl) adminsEl.innerHTML = '';
    return;
  }

  try {
    const [doctors, specialists, admins] = await Promise.all([
      fetch(`/api/doctors?hospitalId=${encodeURIComponent(hospitalId)}`).then((r) => r.json()),
      fetch(`/api/specialists?hospitalId=${encodeURIComponent(hospitalId)}`).then((r) => r.json()),
      fetch(`/api/admins?hospitalId=${encodeURIComponent(hospitalId)}`).then((r) => r.json()),
    ]);

    if (doctorsEl)
      doctorsEl.innerHTML = doctors.length
        ? doctors.map((d) => staffRowMarkup(d, 'Doctor', 'doctor')).join('')
        : empty('No doctors at this hospital.');

    if (specialistsEl)
      specialistsEl.innerHTML = specialists.length
        ? specialists.map((s) => staffRowMarkup(s, 'Specialist', 'specialist')).join('')
        : empty('No specialists at this hospital.');

    if (adminsEl)
      adminsEl.innerHTML = admins.length
        ? admins.map((a) => staffRowMarkup(a, 'Hospital Admin', 'admin')).join('')
        : empty('No admins at this hospital.');
  } catch {
    if (doctorsEl) doctorsEl.innerHTML = empty('Staff directory unavailable.');
    if (specialistsEl) specialistsEl.innerHTML = '';
    if (adminsEl) adminsEl.innerHTML = '';
  }
}

async function initDirectory() {
  await populateHospitalSelect('directory-hospital', true);
  document.getElementById('directory-hospital')?.addEventListener('change', refreshDirectory);
}

// ─── Remove records (delegated click handler) ─────────────────────────────────

async function handleRemove(type, id, name) {
  if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
  try {
    const response = await fetch(`/api/admin/remove/${type}/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    // Refresh whichever panel we're in
    const activePanel = document.querySelector('.panel.active');
    if (activePanel?.id === 'panel-hospitals') loadHospitalsList();
    if (activePanel?.id === 'panel-directory') refreshDirectory();
    // Keep hospital dropdowns fresh
    populateHospitalSelect('site-admin-hospital');
    populateHospitalSelect('directory-hospital', true);
  } catch (error) {
    alert(error.message || 'Could not remove this record.');
  }
}

document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-remove-type]');
  if (!btn) return;
  handleRemove(btn.dataset.removeType, btn.dataset.removeId, btn.dataset.removeName);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const name = getStored(STORAGE_KEYS.userName, '');
  const heading = document.getElementById('site-admin-name');
  if (heading && name) heading.textContent = name;

  initPanels();
  initProvisionForm();
  initDirectory();
});
