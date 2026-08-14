/**
 * CareConnect — Healthcare provider dashboard
 */

requireAuth('provider');

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

const DEMO_PATIENTS = [
  {
    id: 'jordan-lee',
    name: 'Jordan Lee',
    bloodType: 'A positive',
    age: 36,
    sex: 'Female',
    healthCard: '****-****-1234',
    facilityId: 'st-michaels',
    lastVisit: '2026-08-12',
    emergencyContacts: [
      { name: 'Alex Morgan', relationship: 'Partner', phone: '(416) 555-0188' },
      { name: 'Dr. Sarah Chen', relationship: 'Primary provider', phone: '(416) 555-0124' },
      { name: 'Emergency services', relationship: 'Immediate danger', phone: '911' },
    ],
    issues: [
      { type: 'symptom', text: 'Intermittent dizziness when standing', severity: 'medium', date: '2026-08-10', status: 'pending' },
      { type: 'symptom', text: 'Seasonal allergy symptoms', severity: 'low', date: '2026-07-22', status: 'resolved', resolvedDate: '2026-07-29' },
      { type: 'case', text: 'Lab results review', severity: 'medium', date: '2026-08-12', status: 'open', note: 'Awaiting provider review of blood work.' },
      { type: 'case', text: 'Medication adjustment request', severity: 'low', date: '2026-08-11', status: 'pending', note: 'Provider reviewing dosage change.' },
      { type: 'symptom', text: 'Mild fatigue after meals', severity: 'low', date: '2026-06-15', status: 'resolved', resolvedDate: '2026-06-28' },
    ],
  },
  {
    id: 'marcus-wong',
    name: 'Marcus Wong',
    bloodType: 'O negative',
    age: 52,
    sex: 'Male',
    healthCard: '****-****-5678',
    facilityId: 'toronto-general',
    lastVisit: '2026-08-05',
    emergencyContacts: [
      { name: 'Linda Wong', relationship: 'Spouse', phone: '(416) 555-0142' },
      { name: 'David Wong', relationship: 'Son', phone: '(647) 555-0193' },
    ],
    issues: [
      { type: 'symptom', text: 'Chest tightness during exercise', severity: 'high', date: '2026-08-04', status: 'pending' },
      { type: 'case', text: 'Cardiology referral', severity: 'high', date: '2026-08-05', status: 'open', note: 'Echocardiogram scheduled.' },
      { type: 'symptom', text: 'Elevated blood pressure readings', severity: 'medium', date: '2026-07-10', status: 'resolved', resolvedDate: '2026-07-25' },
      { type: 'case', text: 'Hypertension management', severity: 'medium', date: '2026-05-20', status: 'resolved', note: 'Medication stabilized.', resolvedDate: '2026-07-01' },
    ],
  },
  {
    id: 'amira-hassan',
    name: 'Amira Hassan',
    bloodType: 'B positive',
    age: 28,
    sex: 'Female',
    healthCard: '****-****-9012',
    facilityId: 'womens-college',
    lastVisit: '2026-07-28',
    emergencyContacts: [
      { name: 'Fatima Hassan', relationship: 'Mother', phone: '(416) 555-0167' },
      { name: 'Emergency services', relationship: 'Immediate danger', phone: '911' },
    ],
    issues: [
      { type: 'symptom', text: 'Recurring migraines', severity: 'medium', date: '2026-07-20', status: 'pending' },
      { type: 'symptom', text: 'Sensitivity to bright light', severity: 'low', date: '2026-07-18', status: 'pending' },
      { type: 'case', text: 'Neurology consult', severity: 'medium', date: '2026-07-28', status: 'pending', note: 'Awaiting specialist availability.' },
      { type: 'symptom', text: 'Anxiety before exams', severity: 'low', date: '2026-04-10', status: 'resolved', resolvedDate: '2026-05-15' },
    ],
  },
  {
    id: 'robert-tremblay',
    name: 'Robert Tremblay',
    bloodType: 'AB positive',
    age: 67,
    sex: 'Male',
    healthCard: '****-****-3456',
    facilityId: 'mount-sinai',
    lastVisit: '2026-08-01',
    emergencyContacts: [
      { name: 'Claire Tremblay', relationship: 'Daughter', phone: '(905) 555-0111' },
      { name: 'Home care nurse', relationship: 'Caregiver', phone: '(416) 555-0177' },
    ],
    issues: [
      { type: 'case', text: 'Type 2 diabetes follow-up', severity: 'medium', date: '2026-08-01', status: 'open', note: 'HbA1c trending upward.' },
      { type: 'symptom', text: 'Numbness in left foot', severity: 'medium', date: '2026-07-15', status: 'pending' },
      { type: 'symptom', text: 'Joint stiffness in mornings', severity: 'low', date: '2026-06-02', status: 'resolved', resolvedDate: '2026-06-20' },
      { type: 'case', text: 'Annual wellness exam', severity: 'low', date: '2026-03-12', status: 'resolved', note: 'Completed without concerns.', resolvedDate: '2026-03-12' },
    ],
  },
];

const DEMO_SPECIALISTS = [
  { id: 'spec-cardio-1', name: 'Dr. Elena Vasquez', specialty: 'Cardiology', facilityId: 'toronto-general', phone: '(416) 340-4800' },
  { id: 'spec-neuro-1', name: 'Dr. James Okonkwo', specialty: 'Neurology', facilityId: 'toronto-general', phone: '(416) 340-5200' },
  { id: 'spec-ortho-1', name: 'Dr. Priya Sharma', specialty: 'Orthopedics', facilityId: 'mount-sinai', phone: '(416) 596-4500' },
  { id: 'spec-derm-1', name: 'Dr. Michael Lau', specialty: 'Dermatology', facilityId: 'womens-college', phone: '(416) 323-6100' },
  { id: 'spec-endo-1', name: 'Dr. Sophie Bergeron', specialty: 'Endocrinology', facilityId: 'mount-sinai', phone: '(416) 596-4620' },
  { id: 'spec-psych-1', name: 'Dr. Anita Desai', specialty: 'Psychiatry', facilityId: 'st-michaels', phone: '(416) 360-4100' },
  { id: 'spec-gi-1', name: 'Dr. Thomas Reid', specialty: 'Gastroenterology', facilityId: 'toronto-general', phone: '(416) 340-3900' },
  { id: 'spec-rheum-1', name: 'Dr. Catherine Moore', specialty: 'Rheumatology', facilityId: 'womens-college', phone: '(416) 323-6200' },
];

let PROVIDER_SCHEDULE = [
  {
    date: '2026-08-18',
    time: '09:30 AM',
    patientName: 'Jordan Lee',
    patientId: 'jordan-lee',
    specialistName: 'Dr. Sarah Chen',
    specialty: 'Family medicine',
    type: 'Follow-up',
    reason: 'Review recent blood work',
    severity: 'low',
  },
  {
    date: '2026-08-20',
    time: '10:30 AM',
    patientName: 'Jordan Lee',
    patientId: 'jordan-lee',
    specialistName: 'Dr. Sarah Chen',
    specialty: 'Family medicine',
    type: 'Follow-up',
    reason: 'Discuss medication results',
    severity: 'medium',
  },
  {
    date: '2026-08-22',
    time: '02:00 PM',
    patientName: 'Marcus Wong',
    patientId: 'marcus-wong',
    specialistName: 'Dr. Elena Vasquez',
    specialty: 'Cardiology',
    type: 'Specialist consult',
    reason: 'Chest tightness during exercise',
    severity: 'high',
  },
  {
    date: '2026-08-25',
    time: '11:00 AM',
    patientName: 'Amira Hassan',
    patientId: 'amira-hassan',
    specialistName: 'Dr. James Okonkwo',
    specialty: 'Neurology',
    type: 'Specialist consult',
    reason: 'Recurring migraines evaluation',
    severity: 'medium',
  },
];

let selectedPatientId = null;
let selectedClientFacilityId = null;
let selectedSpecialistId = null;
let clientSearchQuery = '';

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

function getFacility(facilityId) {
  return DEMO_FACILITIES.find((f) => f.id === facilityId) || DEMO_FACILITIES[0];
}

function getPatient(patientId) {
  return DEMO_PATIENTS.find((p) => p.id === patientId);
}

function showPanel(panelId) {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-panel') === panelId);
  });

  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${panelId}`);
  });

  if (panelId !== 'clients') {
    hideClientDetail();
  }
}

function initPanels() {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.getAttribute('data-panel')));
  });

  document.querySelectorAll('[data-jump-panel]').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.getAttribute('data-jump-panel')));
  });
}

function renderClientList() {
  const el = document.getElementById('client-list');
  if (!el) return;

  const query = clientSearchQuery.trim().toLowerCase();
  const patients = DEMO_PATIENTS.filter((patient) =>
    `${patient.name} ${patient.healthCard}`.toLowerCase().includes(query),
  );

  if (!patients.length) {
    el.innerHTML = '<div class="empty-state"><p>No clients match your search.</p></div>';
    return;
  }

  el.innerHTML = patients
    .map((patient) => {
      const facility = getFacility(patient.facilityId);
      const pendingCount = patient.issues.filter((issue) => issue.status !== 'resolved').length;

      return `
        <button type="button" class="client-item" data-patient-id="${patient.id}">
          <span class="client-avatar" aria-hidden="true">${escapeHtml(patient.name.charAt(0))}</span>
          <span class="client-item-copy">
            <strong>${escapeHtml(patient.name)}</strong>
            <small>${escapeHtml(patient.sex)} · Age ${patient.age} · ${escapeHtml(patient.bloodType)}</small>
            <small>${escapeHtml(facility.name)} · Last visit ${formatDate(patient.lastVisit)}</small>
          </span>
          <span class="client-item-meta">
            ${pendingCount ? statusBadge('open', `${pendingCount} active`) : statusBadge('resolved', 'Stable')}
            <span aria-hidden="true">›</span>
          </span>
        </button>
      `;
    })
    .join('');
}

function hideClientDetail() {
  selectedPatientId = null;
  document.getElementById('client-list-view')?.removeAttribute('hidden');
  document.getElementById('client-detail-view')?.setAttribute('hidden', '');
}

function showClientDetail(patientId) {
  const patient = getPatient(patientId);
  if (!patient) return;

  selectedPatientId = patientId;
  selectedClientFacilityId = patient.facilityId;

  document.getElementById('client-list-view')?.setAttribute('hidden', '');
  const detailView = document.getElementById('client-detail-view');
  detailView?.removeAttribute('hidden');

  document.getElementById('client-detail-name').textContent = patient.name;
  document.getElementById('client-detail-summary').textContent =
    `${patient.sex}, age ${patient.age} · Health card ${patient.healthCard} · ${patient.issues.length} recorded issues`;

  document.getElementById('client-profile').innerHTML = `
    <div><dt>Blood type</dt><dd>${escapeHtml(patient.bloodType)}</dd></div>
    <div><dt>Age</dt><dd>${patient.age}</dd></div>
    <div><dt>Sex</dt><dd>${escapeHtml(patient.sex)}</dd></div>
    <div><dt>Health card</dt><dd>${escapeHtml(patient.healthCard)}</dd></div>
  `;

  const contactsEl = document.getElementById('client-contacts');
  contactsEl.innerHTML = patient.emergencyContacts
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

  renderClientFacilityMap();
  renderClientFacilityList();
  renderClientSelectedFacility();
  renderClientHistory(patient);
}

function issueStatusBadge(status) {
  if (status === 'resolved') return statusBadge('resolved', 'Resolved');
  if (status === 'open') return statusBadge('open', 'Open');
  return statusBadge('pending', 'Pending');
}

function renderClientHistory(patient) {
  const el = document.getElementById('client-history');
  if (!el) return;

  const sorted = [...patient.issues].sort((a, b) => b.date.localeCompare(a.date));

  if (!sorted.length) {
    el.innerHTML = '<div class="empty-state"><p>No issues recorded for this client.</p></div>';
    return;
  }

  el.innerHTML = sorted
    .map((issue) => {
      const typeLabel = issue.type === 'case' ? 'Care case' : 'Symptom';
      const dateText =
        issue.status === 'resolved' && issue.resolvedDate
          ? `Recorded ${formatDate(issue.date)} · Resolved ${formatDate(issue.resolvedDate)}`
          : `Recorded ${formatDate(issue.date)}`;

      return `
        <article class="list-item history-item">
          <div>
            <p class="section-kicker">${typeLabel}</p>
            <h4>${escapeHtml(issue.text)}</h4>
            <p>${dateText}${issue.note ? ` · ${escapeHtml(issue.note)}` : ''}</p>
          </div>
          <div class="item-badges">
            ${severityBadge(issue.severity)}
            ${issueStatusBadge(issue.status)}
          </div>
        </article>
      `;
    })
    .join('');
}

function renderClientSelectedFacility() {
  const facility = getFacility(selectedClientFacilityId);
  const el = document.getElementById('client-selected-facility');
  const label = document.getElementById('client-facility-label');
  if (!el || !label) return;

  label.textContent = facility.name;
  el.innerHTML = `
    <div>
      <p class="section-kicker">Main care facility</p>
      <h4>${escapeHtml(facility.name)}</h4>
      <p>${escapeHtml(facility.address)} · ${escapeHtml(facility.distance)}</p>
    </div>
    <a class="btn btn-sm" href="tel:${facility.phone.replace(/\D/g, '')}">Call facility</a>
  `;
}

function renderClientFacilityMap() {
  const el = document.getElementById('client-facility-map');
  if (!el) return;

  el.innerHTML = `
    <div class="map-road map-road-one"></div>
    <div class="map-road map-road-two"></div>
    <div class="map-road map-road-three"></div>
    <div class="map-label map-label-north">Downtown Toronto</div>
    <div class="map-label map-label-south">Lake Shore</div>
    ${DEMO_FACILITIES.map(
      (facility) => `
        <button
          type="button"
          class="map-marker${facility.id === selectedClientFacilityId ? ' active' : ''}"
          style="left:${facility.x}%;top:${facility.y}%"
          data-facility-id="${facility.id}"
          aria-label="${escapeHtml(facility.name)}"
          title="${escapeHtml(facility.name)}"
        ></button>
      `,
    ).join('')}
  `;
}

function renderClientFacilityList(filter = '') {
  const el = document.getElementById('client-facility-list');
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
              class="facility-item${facility.id === selectedClientFacilityId ? ' active' : ''}"
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
    : '<div class="empty-state"><p>No facilities match your search.</p></div>';
}

function highlightClientFacility(facilityId) {
  if (!DEMO_FACILITIES.some((f) => f.id === facilityId)) return;
  selectedClientFacilityId = facilityId;
  renderClientSelectedFacility();
  renderClientFacilityMap();
  renderClientFacilityList(document.getElementById('client-facility-search')?.value || '');
}

function initClientList() {
  document.getElementById('client-search')?.addEventListener('input', (event) => {
    clientSearchQuery = event.target.value;
    renderClientList();
  });

  document.getElementById('client-list')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-patient-id]');
    if (button) showClientDetail(button.getAttribute('data-patient-id'));
  });

  document.getElementById('back-to-clients')?.addEventListener('click', hideClientDetail);

  document.getElementById('client-facility-search')?.addEventListener('input', (event) => {
    renderClientFacilityList(event.target.value);
  });

  document.getElementById('client-facility-list')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-facility-id]');
    if (button) highlightClientFacility(button.getAttribute('data-facility-id'));
  });

  document.getElementById('client-facility-map')?.addEventListener('click', (event) => {
    const marker = event.target.closest('[data-facility-id]');
    if (marker) highlightClientFacility(marker.getAttribute('data-facility-id'));
  });
}

function initBookingForm() {
  const patientSelect = document.getElementById('booking-patient');
  const specialtySelect = document.getElementById('specialty-filter');

  if (patientSelect) {
    patientSelect.innerHTML = DEMO_PATIENTS.map(
      (patient) => `<option value="${patient.id}">${escapeHtml(patient.name)}</option>`,
    ).join('');
  }

  if (specialtySelect) {
    const specialties = [...new Set(DEMO_SPECIALISTS.map((s) => s.specialty))].sort();
    specialtySelect.innerHTML =
      '<option value="">All specialties</option>' +
      specialties.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  }

  specialtySelect?.addEventListener('change', renderSpecialistList);
  renderSpecialistList();

  document.getElementById('specialist-list')?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-specialist-id]');
    if (!card) return;
    selectedSpecialistId = card.getAttribute('data-specialist-id');
    document.getElementById('booking-specialist').value = selectedSpecialistId;
    renderSpecialistList();
  });

  document.getElementById('specialist-booking-form')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const patientId = document.getElementById('booking-patient').value;
    const specialistId = document.getElementById('booking-specialist').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const reason = document.getElementById('booking-reason').value.trim();

    const patient = getPatient(patientId);
    const specialist = DEMO_SPECIALISTS.find((s) => s.id === specialistId);
    if (!patient || !specialist || !date || !time || !reason) return;

    PROVIDER_SCHEDULE.push({
      date,
      time,
      patientName: patient.name,
      patientId: patient.id,
      specialistName: specialist.name,
      specialty: specialist.specialty,
      type: 'Specialist consult',
      reason,
      severity: 'medium',
    });
    PROVIDER_SCHEDULE.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    renderSchedule();
    event.target.reset();
    selectedSpecialistId = null;
    document.getElementById('booking-specialist').value = '';
    renderSpecialistList();
    alert(`Specialist appointment booked with ${specialist.name} for ${patient.name}.`);
    showPanel('schedule');
  });
}

function renderSpecialistList() {
  const el = document.getElementById('specialist-list');
  if (!el) return;

  const filter = document.getElementById('specialty-filter')?.value || '';
  const specialists = DEMO_SPECIALISTS.filter((s) => !filter || s.specialty === filter);

  if (!specialists.length) {
    el.innerHTML = '<div class="empty-state"><p>No specialists match this specialty.</p></div>';
    return;
  }

  el.innerHTML = specialists
    .map((specialist) => {
      const facility = getFacility(specialist.facilityId);
      const isSelected = specialist.id === selectedSpecialistId;

      return `
        <button
          type="button"
          class="specialist-card${isSelected ? ' selected' : ''}"
          data-specialist-id="${specialist.id}"
        >
          <span class="specialist-card-header">
            <strong>${escapeHtml(specialist.name)}</strong>
            ${isSelected ? statusBadge('resolved', 'Selected') : ''}
          </span>
          <span class="specialist-specialty">${escapeHtml(specialist.specialty)}</span>
          <span class="specialist-facility">${escapeHtml(facility.name)} · ${escapeHtml(facility.distance)}</span>
          <span class="specialist-phone">${escapeHtml(specialist.phone)}</span>
        </button>
      `;
    })
    .join('');
}

function renderSchedule() {
  const el = document.getElementById('schedule-list');
  if (!el) return;

  if (!PROVIDER_SCHEDULE.length) {
    el.innerHTML = '<div class="empty-state"><p>No appointments scheduled.</p></div>';
    return;
  }

  el.innerHTML = PROVIDER_SCHEDULE.map(
    (appointment) => `
      <article class="appointment-item">
        <div class="appointment-date">
          <span>${formatDate(appointment.date).split(' ')[0]}</span>
          <strong>${formatDate(appointment.date).split(' ')[1].replace(',', '')}</strong>
        </div>
        <div class="appointment-details">
          <p class="section-kicker">${escapeHtml(appointment.type)} · ${escapeHtml(appointment.specialty)}</p>
          <h3>${escapeHtml(appointment.patientName)} with ${escapeHtml(appointment.specialistName)}</h3>
          <p>${formatDate(appointment.date)} at ${escapeHtml(appointment.time)}</p>
          <p class="appointment-reason">${escapeHtml(appointment.reason)}</p>
        </div>
        <div class="appointment-status">
          ${severityBadge(appointment.severity || 'low')}
          ${statusBadge('resolved', 'Scheduled')}
        </div>
      </article>
    `,
  ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderClientList();
  renderSchedule();
  initPanels();
  initClientList();
  initBookingForm();
});
