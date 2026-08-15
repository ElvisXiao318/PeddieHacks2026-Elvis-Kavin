/**
 * CarePath — Patient dashboard
 */

requireAuth('patient');

async function hydratePatientProfile() {
  const patientId = getStored(STORAGE_KEYS.userId, '');
  if (!patientId) return;
  try {
    const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` } });
    if (!response.ok) return;
    const patient = await response.json();
    const birthday = new Date(`${patient.date_of_birth}T12:00:00`);
    const age = new Date().getFullYear() - birthday.getFullYear() - (new Date() < new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate()) ? 1 : 0);
    document.getElementById('patient-welcome').textContent = `Welcome back, ${patient.patient_name}`;
    document.getElementById('patient-age').textContent = age;
    document.getElementById('patient-gender').textContent = patient.gender;
    document.getElementById('patient-health-card').textContent = patient.health_card_number;
    EMERGENCY_CONTACTS.splice(0, EMERGENCY_CONTACTS.length, ...patient.emergency_contacts);
    DEMO_SYMPTOMS.splice(0, DEMO_SYMPTOMS.length, ...patient.symptoms);
    DEMO_MISSED.splice(0, DEMO_MISSED.length, ...patient.messages);
    DEMO_CASES.splice(0, DEMO_CASES.length, ...patient.cases);
    DEMO_MEDICATIONS.splice(0, DEMO_MEDICATIONS.length, ...patient.medications);
    renderEmergencyContacts();
    renderSymptoms(); renderMissed(); renderCases(); renderMedications();
  } catch { /* The dashboard retains its illustrative values if the API is unavailable. */ }
}

async function loadAppointments() {
  const patientId = getStored(STORAGE_KEYS.userId, '');
  const token = getStored(STORAGE_KEYS.sessionToken, '');
  if (!patientId || !token) return;
  try {
    const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Appointments unavailable.');
    const appointments = await response.json();
    DEMO_APPOINTMENTS.splice(0, DEMO_APPOINTMENTS.length, ...appointments);
    renderAppointments();
  } catch {
    /* The list remains empty when the server cannot be reached. */
  }
}

const DEMO_APPOINTMENTS = [
  {
    date: '2026-08-20',
    time: '10:30 AM',
    provider: 'Dr. Sarah Chen',
    type: 'Follow-up',
    reason: 'Review recent blood work',
    severity: 'low',
  },
  {
    date: '2026-09-03',
    time: '02:00 PM',
    provider: 'Dr. Sarah Chen',
    type: 'Lab review',
    reason: 'Discuss medication results',
    severity: 'medium',
  },
];

const DEMO_SYMPTOMS = [
  {
    text: 'Intermittent dizziness when standing',
    severity: 'medium',
    date: '2026-08-10',
    status: 'pending',
  },
  {
    text: 'Seasonal allergy symptoms',
    severity: 'low',
    date: '2026-07-22',
    status: 'resolved',
    resolvedDate: '2026-07-29',
  },
];

const DEMO_MISSED = [
  {
    from: 'Dr. Sarah Chen',
    date: '2026-08-08',
    subject: 'Lab results follow-up',
    channel: 'Secure message',
  },
];

const DEMO_CASES = [
  {
    title: 'Lab results review',
    status: 'open',
    updated: '2026-08-12',
    note: 'Awaiting provider review of blood work.',
  },
  {
    title: 'Medication adjustment request',
    status: 'pending',
    updated: '2026-08-11',
    note: 'Provider reviewing dosage change.',
  },
];

const DEMO_MEDICATIONS = [
  { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily' },
  { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily' },
];

const EMERGENCY_CONTACTS = [
  { name: 'Alex Morgan', relationship: 'Partner', phone: '(416) 555-0188' },
  { name: 'Dr. Sarah Chen', relationship: 'Primary provider', phone: '(416) 555-0124' },
  { name: 'Emergency services', relationship: 'Immediate danger', phone: '911' },
];

const DEMO_FACILITIES = [
  {
    id: 'st-michaels',
    name: "St. Michael's Hospital",
    type: 'Hospital',
    distance: '1.8 km away',
    address: '30 Bond Street, Toronto, ON',
    phone: '(416) 360-4000',
    x: 28,
    y: 36,
  },
  {
    id: 'toronto-general',
    name: 'Toronto General Hospital',
    type: 'Hospital',
    distance: '3.2 km away',
    address: '200 Elizabeth Street, Toronto, ON',
    phone: '(416) 340-3111',
    x: 66,
    y: 26,
  },
  {
    id: 'womens-college',
    name: "Women's College Hospital",
    type: 'Specialty hospital',
    distance: '2.5 km away',
    address: '76 Grenville Street, Toronto, ON',
    phone: '(416) 323-6400',
    x: 49,
    y: 64,
  },
  {
    id: 'mount-sinai',
    name: 'Mount Sinai Hospital',
    type: 'Hospital',
    distance: '2.7 km away',
    address: '600 University Avenue, Toronto, ON',
    phone: '(416) 596-4200',
    x: 76,
    y: 72,
  },
  {
    id: 'downtown-clinic',
    name: 'Downtown Community Clinic',
    type: 'Community clinic',
    distance: '3.9 km away',
    address: '85 Dundas Street East, Toronto, ON',
    phone: '(416) 555-0199',
    x: 18,
    y: 78,
  },
];

let selectedFacilityId = getStored('carepath-facility', 'st-michaels');
let mapScale = 1;
let mapOffset = { x: 0, y: 0 };
let mapDragState = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateString}T12:00:00`));
}

function severityLabel(severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function severityBadge(severity) {
  return `<span class="severity-badge severity-${severity}">${severityLabel(severity)}</span>`;
}

function renderAppointments() {
  const el = document.getElementById('appointments-list');
  if (!el) return;

  if (!DEMO_APPOINTMENTS.length) {
    el.innerHTML = '<div class="empty-state"><p>No upcoming appointments.</p></div>';
    return;
  }

  el.innerHTML = DEMO_APPOINTMENTS
    .map(
      (appointment) => `
        <article class="appointment-item">
          <div class="appointment-date">
            <span>${formatDate(appointment.date).split(' ')[0]}</span>
            <strong>${formatDate(appointment.date).split(' ')[1].replace(',', '')}</strong>
          </div>
          <div class="appointment-details">
            <p class="section-kicker">${escapeHtml(appointment.type)}</p>
            <h3>${escapeHtml(appointment.provider)}</h3>
            <p>${formatDate(appointment.date)} at ${escapeHtml(appointment.time)}</p>
            <p class="appointment-reason">${escapeHtml(appointment.reason || 'Scheduled visit')}</p>
          </div>
          <div class="appointment-status">
            ${severityBadge(appointment.severity || 'low')}
            ${appointment.status === 'requested' ? statusBadge('pending', 'Requested') : statusBadge('resolved', 'Scheduled')}
          </div>
        </article>
      `,
    )
    .join('');
}

function symptomMarkup(symptom) {
  const isResolved = symptom.status === 'resolved';
  const status = isResolved ? statusBadge('resolved', 'Resolved') : statusBadge('open', 'Pending');
  const dateText = isResolved
    ? `Logged ${formatDate(symptom.date)} · Resolved ${formatDate(symptom.resolvedDate)}`
    : `Logged ${formatDate(symptom.date)} · Active`;

  return `
    <article class="list-item symptom-item">
      <div>
        <h4>${escapeHtml(symptom.text)}</h4>
        <p>${dateText} · ${severityLabel(symptom.severity)} severity</p>
      </div>
      <div class="item-badges">
        ${severityBadge(symptom.severity)}
        ${status}
      </div>
    </article>
  `;
}

function renderSymptoms() {
  const pending = DEMO_SYMPTOMS.filter((symptom) => symptom.status !== 'resolved');
  const resolved = DEMO_SYMPTOMS.filter((symptom) => symptom.status === 'resolved');
  const pendingEl = document.getElementById('pending-symptoms');
  const resolvedEl = document.getElementById('resolved-symptoms');

  if (pendingEl) {
    pendingEl.innerHTML = pending.length
      ? pending.map(symptomMarkup).join('')
      : '<div class="empty-state"><p>No pending symptoms or issues.</p></div>';
  }

  if (resolvedEl) {
    resolvedEl.innerHTML = resolved.length
      ? resolved.map(symptomMarkup).join('')
      : '<div class="empty-state"><p>No resolved symptoms or issues yet.</p></div>';
  }

  document.getElementById('pending-count').textContent = pending.length;
  document.getElementById('resolved-count').textContent = resolved.length;
}

function renderMissed() {
  const el = document.getElementById('missed-list');
  if (!el) return;

  if (!DEMO_MISSED.length) {
    el.innerHTML = '<div class="empty-state"><p>No new care team messages.</p></div>';
    return;
  }

  el.innerHTML = DEMO_MISSED
    .map(
      (message) => `
        <div class="list-item">
          <div>
            <h4>${escapeHtml(message.subject)}</h4>
            <p>From ${escapeHtml(message.from)} · ${formatDate(message.date)} · ${escapeHtml(message.channel)}</p>
          </div>
          ${statusBadge('pending', 'New')}
        </div>
      `,
    )
    .join('');
}

function renderCases() {
  const el = document.getElementById('cases-list');
  if (!el) return;

  if (!DEMO_CASES.length) {
    el.innerHTML = '<div class="empty-state"><p>No pending cases.</p></div>';
    return;
  }

  el.innerHTML = DEMO_CASES
    .map((careCase) => {
      const badge =
        careCase.status === 'open'
          ? statusBadge('open', 'Open')
          : careCase.status === 'pending'
            ? statusBadge('pending', 'Pending')
            : statusBadge('resolved', 'Resolved');

      return `
        <div class="list-item">
          <div>
            <h4>${escapeHtml(careCase.title)}</h4>
            <p>${escapeHtml(careCase.note)} · Updated ${formatDate(careCase.updated)}</p>
          </div>
          ${badge}
        </div>
      `;
    })
    .join('');
}

function renderMedications() {
  const el = document.getElementById('medications-list');
  if (!el) return;

  el.innerHTML = DEMO_MEDICATIONS
    .map(
      (medication) => `
        <div class="list-item">
          <div>
            <h4>${escapeHtml(medication.name)}</h4>
            <p>${escapeHtml(medication.dosage)} · ${escapeHtml(medication.frequency)}</p>
          </div>
        </div>
      `,
    )
    .join('');
}

function renderEmergencyContacts() {
  const el = document.getElementById('emergency-contacts');
  if (!el) return;

  el.innerHTML = EMERGENCY_CONTACTS
    .map(
      (contact) => `
        <div class="contact-item">
          <div>
            <h4>${escapeHtml(contact.name)}</h4>
            <p>${escapeHtml(contact.relationship)}</p>
          </div>
          <a href="tel:${contact.phone.replace(/\D/g, '')}">${escapeHtml(contact.phone)}</a>
        </div>
      `,
    )
    .join('');
}

function renderSelectedFacility() {
  const facility = DEMO_FACILITIES.find((item) => item.id === selectedFacilityId) || DEMO_FACILITIES[0];
  const el = document.getElementById('selected-facility');
  const label = document.getElementById('selected-facility-label');
  if (!el || !label) return;

  label.textContent = facility.name;
  el.innerHTML = `
    <div>
      <p class="section-kicker">Main care facility</p>
      <h4>${escapeHtml(facility.name)}</h4>
      <p>${escapeHtml(facility.address)} · ${escapeHtml(facility.distance)}</p>
    </div>
    <div class="selected-facility-actions">
      <a
        class="btn btn-sm"
        href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.address)}"
        target="_blank"
        rel="noopener noreferrer"
      >Get directions</a>
      <a class="btn btn-sm" href="tel:${facility.phone.replace(/\D/g, '')}">Call facility</a>
    </div>
  `;
}

function renderFacilityMap() {
  const canvas = document.getElementById('facility-map-canvas');
  if (!canvas) return;

  canvas.innerHTML = `
    <div class="map-road map-road-one"></div>
    <div class="map-road map-road-two"></div>
    <div class="map-road map-road-three"></div>
    <div class="map-label map-label-north">Downtown Toronto</div>
    <div class="map-label map-label-south">Lake Shore</div>
    ${DEMO_FACILITIES.map(
      (facility) => `
        <button
          type="button"
          class="map-marker${facility.id === selectedFacilityId ? ' active' : ''}"
          style="left:${facility.x}%;top:${facility.y}%"
          data-facility-id="${facility.id}"
          aria-label="Select ${escapeHtml(facility.name)}"
          title="${escapeHtml(facility.name)}"
        ></button>
      `,
    ).join('')}
  `;
  applyMapTransform();
}

function applyMapTransform() {
  const canvas = document.getElementById('facility-map-canvas');
  if (!canvas) return;

  canvas.style.transform = `translate3d(${mapOffset.x}px, ${mapOffset.y}px, 0) scale(${mapScale})`;
}

function centerMapOnFacility(facilityId, zoomToSelection = true) {
  const map = document.getElementById('facility-map');
  const facility = DEMO_FACILITIES.find((item) => item.id === facilityId);
  if (!map || !facility) return;

  const width = map.clientWidth;
  const height = map.clientHeight;
  if (!width || !height) return;

  if (zoomToSelection) {
    mapScale = Math.max(mapScale, 1.25);
  }

  const facilityX = (facility.x / 100) * width;
  const facilityY = (facility.y / 100) * height;
  mapOffset = {
    x: width / 2 - facilityX * mapScale,
    y: height / 2 - facilityY * mapScale,
  };
  applyMapTransform();
}

function zoomMap(nextScale, focusX, focusY) {
  const map = document.getElementById('facility-map');
  if (!map) return;

  const oldScale = mapScale;
  mapScale = Math.min(3, Math.max(0.7, nextScale));
  const x = focusX ?? map.clientWidth / 2;
  const y = focusY ?? map.clientHeight / 2;

  mapOffset = {
    x: x - (x - mapOffset.x) * (mapScale / oldScale),
    y: y - (y - mapOffset.y) * (mapScale / oldScale),
  };
  applyMapTransform();
}

function resetMap() {
  mapScale = 1;
  mapOffset = { x: 0, y: 0 };
  applyMapTransform();
}

function initMapInteractions() {
  const map = document.getElementById('facility-map');
  const canvas = document.getElementById('facility-map-canvas');
  if (!map || !canvas) return;

  map.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, a')) return;

    mapDragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: mapOffset.x,
      originY: mapOffset.y,
    };
    map.classList.add('is-dragging');
    map.setPointerCapture(event.pointerId);
  });

  map.addEventListener('pointermove', (event) => {
    if (!mapDragState || mapDragState.pointerId !== event.pointerId) return;

    mapOffset = {
      x: mapDragState.originX + event.clientX - mapDragState.startX,
      y: mapDragState.originY + event.clientY - mapDragState.startY,
    };
    applyMapTransform();
  });

  const endDrag = (event) => {
    if (!mapDragState || mapDragState.pointerId !== event.pointerId) return;
    map.classList.remove('is-dragging');
    if (map.hasPointerCapture(event.pointerId)) {
      map.releasePointerCapture(event.pointerId);
    }
    mapDragState = null;
  };

  map.addEventListener('pointerup', endDrag);
  map.addEventListener('pointercancel', endDrag);

  map.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const rect = map.getBoundingClientRect();
      const focusX = event.clientX - rect.left;
      const focusY = event.clientY - rect.top;
      zoomMap(mapScale + (event.deltaY < 0 ? 0.15 : -0.15), focusX, focusY);
    },
    { passive: false },
  );

  document.getElementById('map-zoom-in')?.addEventListener('click', () => {
    zoomMap(mapScale + 0.25);
  });

  document.getElementById('map-zoom-out')?.addEventListener('click', () => {
    zoomMap(mapScale - 0.25);
  });

  document.getElementById('map-reset')?.addEventListener('click', resetMap);
}

function renderFacilityList(filter = '') {
  const el = document.getElementById('facility-list');
  if (!el) return;

  const query = filter.trim().toLowerCase();
  const facilities = DEMO_FACILITIES.filter((facility) =>
    `${facility.name} ${facility.type} ${facility.address}`.toLowerCase().includes(query),
  );

  el.innerHTML = facilities.length
    ? facilities
        .map(
          (facility) => `
            <button
              type="button"
              class="facility-item${facility.id === selectedFacilityId ? ' active' : ''}"
              data-facility-id="${facility.id}"
            >
              <span class="facility-icon" aria-hidden="true">+</span>
              <span class="facility-item-copy">
                <strong>${escapeHtml(facility.name)}</strong>
                <small>${escapeHtml(facility.type)} · ${escapeHtml(facility.distance)}</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          `,
        )
        .join('')
    : '<div class="empty-state"><p>No nearby facilities match your search.</p></div>';
}

function selectFacility(facilityId) {
  if (!DEMO_FACILITIES.some((facility) => facility.id === facilityId)) return;
  selectedFacilityId = facilityId;
  setStored('carepath-facility', facilityId);
  renderSelectedFacility();
  renderFacilityMap();
  renderFacilityList(document.getElementById('facility-search')?.value || '');
  centerMapOnFacility(facilityId);
}

function initFacilitySelector() {
  if (!DEMO_FACILITIES.some((facility) => facility.id === selectedFacilityId)) {
    selectedFacilityId = DEMO_FACILITIES[0].id;
  }

  renderSelectedFacility();
  renderFacilityMap();
  renderFacilityList();
  initMapInteractions();
  centerMapOnFacility(selectedFacilityId, false);

  const facilitySearch = document.getElementById('facility-search');
  const facilityList = document.getElementById('facility-list');

  facilitySearch?.addEventListener('focus', () => {
    renderFacilityList(facilitySearch.value);
    facilityList?.classList.add('open');
  });

  facilitySearch?.addEventListener('input', (event) => {
    renderFacilityList(event.target.value);
    facilityList?.classList.add('open');
  });

  document.addEventListener('click', (event) => {
    if (!facilitySearch?.contains(event.target) && !facilityList?.contains(event.target)) {
      facilityList?.classList.remove('open');
    }
  });

  facilityList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-facility-id]');
    if (button) {
      selectFacility(button.getAttribute('data-facility-id'));
      facilityList.classList.remove('open');
      if (facilitySearch) facilitySearch.value = '';
    }
  });

  document.getElementById('facility-map')?.addEventListener('click', (event) => {
    const marker = event.target.closest('[data-facility-id]');
    if (marker) selectFacility(marker.getAttribute('data-facility-id'));
  });
}

function showPanel(panelId) {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-panel') === panelId);
  });

  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${panelId}`);
  });
}

function initPanels() {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.getAttribute('data-panel')));
  });

  document.querySelectorAll('[data-jump-panel]').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.getAttribute('data-jump-panel')));
  });
}

function initSymptomFilters() {
  document.querySelectorAll('[data-symptom-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-symptom-filter');

      document.querySelectorAll('[data-symptom-filter]').forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      document.querySelectorAll('.symptom-status-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `symptom-status-${filter}`);
      });
    });
  });
}

function initSymptomForm() {
  document.getElementById('symptom-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const text = document.getElementById('symptom-input').value.trim();
    const severity = document.getElementById('symptom-severity').value;
    if (!text) return;

    try {
      const response = await fetch('/api/symptoms', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` }, body: JSON.stringify({ patientId: getStored(STORAGE_KEYS.userId, ''), text, severity }) });
      const symptom = await response.json();
      if (!response.ok) throw new Error(symptom.error || 'Unable to save symptom.');
      DEMO_SYMPTOMS.unshift(symptom);
      event.target.reset(); renderSymptoms();
      document.querySelector('[data-symptom-filter="pending"]')?.click();
    } catch (error) { alert(error.message); }
  });
}

function initAppointmentForm() {
  document.getElementById('appointment-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const date = document.getElementById('appt-date').value;
    const time = document.getElementById('appt-time').value;
    const reason = document.getElementById('appt-reason').value.trim();
    const severity = document.getElementById('appt-severity').value;
    const type = document.getElementById('appt-type');
    const typeLabel = type.options[type.selectedIndex].text;

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}`,
        },
        body: JSON.stringify({
          patientId: getStored(STORAGE_KEYS.userId, ''),
          date,
          time,
          reason,
          severity,
          type: typeLabel,
        }),
      });
      const appointment = await response.json();
      if (!response.ok) throw new Error(appointment.error || 'Unable to submit the appointment request.');
      DEMO_APPOINTMENTS.push(appointment);
      DEMO_APPOINTMENTS.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      renderAppointments();
      event.target.reset();
      alert('Appointment request submitted successfully.');
      showPanel('overview');
    } catch (error) {
      alert(error.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  DEMO_APPOINTMENTS.splice(0);
  DEMO_SYMPTOMS.splice(0);
  DEMO_MISSED.splice(0);
  DEMO_CASES.splice(0);
  DEMO_MEDICATIONS.splice(0);
  EMERGENCY_CONTACTS.splice(0);
  renderAppointments();
  renderEmergencyContacts();
  renderFacilityList();
  renderFacilityMap();
  renderSelectedFacility();
  renderMissed();
  renderCases();
  renderMedications();
  renderSymptoms();
  initPanels();
  initFacilitySelector();
  initSymptomFilters();
  initSymptomForm();
  initAppointmentForm();
  await Promise.all([hydratePatientProfile(), loadAppointments()]);
});
