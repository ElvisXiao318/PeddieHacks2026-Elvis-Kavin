/**
 * CarePath site admin dashboard.
 *
 * The site admin is the only role that can add or remove hospitals,
 * doctors, specialists, and hospital admins. None of those roles can
 * sign themselves up.
 */

// Only logged in site admins may view this page.
requireAuth('site-admin');

/* ---------- Helpers ---------- */

// Escapes special HTML characters so user text cannot break the page.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Builds the Authorization header with the saved session token.
function authHeader() {
  return { Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` };
}

// Shows a success or error message in the element with the given id.
function setMessage(id, text, success = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  el.style.color = success ? 'var(--success)' : 'var(--danger)';
}

/* ---------- Panel navigation ---------- */

// Switches which dashboard panel is visible and refreshes its data.
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

// Wires up the sidebar navigation buttons.
function initPanels() {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => showPanel(btn.getAttribute('data-panel')));
  });
}

/* ---------- Searchable hospital picker ---------- */

// The full hospital list is large, so the picker shows at most this many results.
const HOSPITAL_RESULT_LIMIT = 50;
// Hospitals loaded from the server, shared by every picker on the page.
let hospitalsCache = [];

// Fetches the hospital list from the server.
async function fetchHospitals() {
  const response = await fetch('/api/hospitals');
  if (!response.ok) throw new Error('Could not load hospitals.');
  return response.json();
}

// Refreshes the shared hospital cache, leaving it empty if the request fails.
async function loadHospitals() {
  try {
    hospitalsCache = await fetchHospitals();
  } catch {
    hospitalsCache = [];
  }
}

// Draws the hospitals that match the search text into the dropdown list,
// with a hint when there are more matches than can be shown.
function renderHospitalOptions(listEl, query) {
  const q = query.trim().toLowerCase();
  const matches = hospitalsCache.filter((h) =>
    `${h.name} ${h.address || ''}`.toLowerCase().includes(q),
  );

  if (!matches.length) {
    listEl.innerHTML = '<div class="empty-state"><p>No hospitals match this search.</p></div>';
    return;
  }

  const shown = matches.slice(0, HOSPITAL_RESULT_LIMIT);
  listEl.innerHTML =
    shown
      .map(
        (h) => `
          <button type="button" class="facility-item" data-hospital-id="${h.id}" data-hospital-name="${escapeHtml(h.name)}">
            <span class="facility-icon" aria-hidden="true">+</span>
            <span class="facility-item-copy">
              <strong>${escapeHtml(h.name)}</strong>
              <small>${escapeHtml(h.address || 'No address on file')}</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        `,
      )
      .join('') +
    (matches.length > shown.length
      ? `<div class="empty-state"><p>Showing ${shown.length} of ${matches.length} — keep typing to narrow the list.</p></div>`
      : '');
}

// Sets up one searchable hospital picker. The visible input holds the typed
// text, the hidden input holds the chosen hospital id, and the dropdown
// opens on focus, filters as the user types, and closes on outside clicks.
function initHospitalPicker(searchId, listId, valueId, onSelect) {
  const search = document.getElementById(searchId);
  const list = document.getElementById(listId);
  const value = document.getElementById(valueId);
  if (!search || !list || !value) return;

  const open = () => {
    renderHospitalOptions(list, search.value);
    list.classList.add('open');
  };

  search.addEventListener('focus', open);
  search.addEventListener('input', () => {
    // Typing again clears any hospital that was already chosen.
    if (value.value) {
      value.value = '';
      onSelect?.('');
    }
    open();
  });

  list.addEventListener('click', (event) => {
    const item = event.target.closest('[data-hospital-id]');
    if (!item) return;
    value.value = item.dataset.hospitalId;
    search.value = item.dataset.hospitalName;
    list.classList.remove('open');
    onSelect?.(value.value);
  });

  document.addEventListener('click', (event) => {
    if (!search.contains(event.target) && !list.contains(event.target)) {
      list.classList.remove('open');
    }
  });
}

/* ---------- Add record form ---------- */

// Sets up the add record form: shows the right fields for the chosen record
// type, validates the hospital choice, and submits the record to the server.
function initProvisionForm() {
  const typeSelect = document.getElementById('site-admin-type');
  const staffFields = document.querySelectorAll('.provision-staff-field');
  const hospitalOnlyFields = document.querySelectorAll('.provision-hospital-only');

  // Staff records need account fields, hospital records need address fields.
  function updateFields() {
    const isHospital = typeSelect.value === 'hospital';
    staffFields.forEach((f) => (f.style.display = isHospital ? 'none' : ''));
    hospitalOnlyFields.forEach((f) => (f.style.display = isHospital ? '' : 'none'));
    document.getElementById('site-admin-email').required = !isHospital;
    document.getElementById('site-admin-password').required = !isHospital;
    document.getElementById('site-admin-hospital-search').required = !isHospital;
  }

  typeSelect?.addEventListener('change', updateFields);
  updateFields();

  initHospitalPicker('site-admin-hospital-search', 'site-admin-hospital-list', 'site-admin-hospital');

  document.getElementById('site-admin-provision-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = (id) => document.getElementById(id)?.value.trim() ?? '';
    const type = value('site-admin-type');
    const isHospital = type === 'hospital';

    if (!isHospital && !value('site-admin-hospital')) {
      setMessage('site-admin-message', 'Select a hospital from the search list.');
      return;
    }

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
      // Refresh hospital pickers if a hospital was just added
      if (isHospital) loadHospitals();
    } catch (error) {
      setMessage('site-admin-message', error.message || 'Could not add this record.');
    }
  });
}

/* ---------- Hospitals list panel ---------- */

// Draws the list of every hospital with a remove button for each.
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

/* ---------- Staff directory panel ---------- */

// Builds one staff directory row with the person's role and a remove button.
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

// Loads and draws the doctors, specialists, and admins at the selected
// hospital. The admins request needs the site admin session token.
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
      fetch(`/api/admins?hospitalId=${encodeURIComponent(hospitalId)}`, { headers: authHeader() }).then((r) => r.json()),
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

// Sets up the staff directory's hospital picker.
async function initDirectory() {
  await loadHospitals();
  initHospitalPicker('directory-hospital-search', 'directory-hospital-list', 'directory-hospital', refreshDirectory);
}

/* ---------- Remove records (delegated click handler) ---------- */

// Asks for confirmation, deletes the record on the server, then refreshes
// whichever panel is open plus the hospital cache.
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
    // Keep hospital pickers fresh
    loadHospitals();
  } catch (error) {
    alert(error.message || 'Could not remove this record.');
  }
}

// One shared click handler catches every remove button on the page.
document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-remove-type]');
  if (!btn) return;
  handleRemove(btn.dataset.removeType, btn.dataset.removeId, btn.dataset.removeName);
});

/* ---------- Boot ---------- */

// Starts the page: shows the admin's name and wires up every panel.
document.addEventListener('DOMContentLoaded', () => {
  const name = getStored(STORAGE_KEYS.userName, '');
  const heading = document.getElementById('site-admin-name');
  if (heading && name) heading.textContent = name;

  initPanels();
  initProvisionForm();
  initDirectory();
});
