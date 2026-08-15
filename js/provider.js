/**
 * CarePath — Healthcare provider dashboard
 */

requireAuth('provider');

const PROVIDER_ID = getStored(STORAGE_KEYS.userId, '');
const APPOINTMENT_TYPES = ['Follow-up', 'Consultation', 'Specialist consult', 'Lab review', 'Check-up', 'Urgent visit'];
const PROVIDER_RESULT_LIMIT = 30;

let selectedPatientId = null;
let selectedClientFacilityId = null;
let selectedBookingDoctorId = null;
let clientSearchQuery = '';
let scope = 'mine';

/** The signed-in doctor or specialist. Falls back to the name stored at login. */
function currentProvider() {
  const provider = getProvider(PROVIDER_ID);
  if (provider) return provider;
  return {
    id: PROVIDER_ID,
    name: getStored(STORAGE_KEYS.userName, 'Provider') || 'Provider',
    specialty: '',
    facilityId: getStored(STORAGE_KEYS.hospitalId, ''),
    phone: '',
  };
}

function renderProviderIdentity() {
  const provider = currentProvider();
  const facility = provider.facilityId ? getFacility(provider.facilityId) : null;

  const title = document.getElementById('provider-name');
  if (title) title.textContent = `Welcome, ${provider.name}`;

  const subtitle = document.getElementById('provider-subtitle');
  if (subtitle) {
    const details = [provider.specialty, facility?.name].filter(Boolean).join(' · ');
    subtitle.textContent = details
      ? `${details} — manage your patients, referrals, and upcoming visits.`
      : 'Manage your patients, referrals, and upcoming visits.';
  }

  const scopeSelect = document.getElementById('provider-scope');
  if (scopeSelect) {
    scopeSelect.innerHTML = `
      <option value="mine">My patients</option>
      <option value="facility">Everyone at ${escapeHtml(facility ? facility.name : 'my facility')}</option>
    `;
    scopeSelect.value = scope;
    scopeSelect.disabled = !provider.facilityId;
  }

  document.title = `${provider.name} — CarePath`;
}

/** Patients in the current scope: the provider's own roster, or the whole facility. */
function scopedPatients() {
  const provider = currentProvider();
  if (scope === 'facility') {
    return DEMO_PATIENTS.filter((patient) => patient.facilityId === provider.facilityId);
  }
  const referredIds = new Set(
    PROVIDER_SCHEDULE.filter((appointment) => appointment.doctorId === provider.id).map((a) => a.patientId),
  );
  return DEMO_PATIENTS.filter(
    (patient) => patient.primaryDoctorId === provider.id || referredIds.has(patient.id),
  );
}

/** Appointments in the current scope. */
function scopedAppointments() {
  const provider = currentProvider();
  const appointments = PROVIDER_SCHEDULE.filter((appointment) =>
    scope === 'facility'
      ? appointment.facilityId === provider.facilityId
      : appointment.doctorId === provider.id,
  );
  return [...appointments].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );
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

function initScope() {
  document.getElementById('provider-scope')?.addEventListener('change', (event) => {
    scope = event.target.value;
    hideClientDetail();
    renderClientList();
    renderSchedule();
    renderBookingPatients();
  });
}

function renderClientList() {
  const el = document.getElementById('client-list');
  if (!el) return;

  const query = clientSearchQuery.trim().toLowerCase();
  const patients = scopedPatients().filter((patient) =>
    `${patient.name} ${patient.healthCard}`.toLowerCase().includes(query),
  );

  const count = document.getElementById('client-count');
  if (count) {
    count.textContent = patients.length === 1 ? '1 client' : `${patients.length} clients`;
  }

  if (!patients.length) {
    el.innerHTML = `<div class="empty-state"><p>${
      query
        ? 'No clients match your search.'
        : 'No clients are assigned to you yet. Switch the view above to see everyone at your facility.'
    }</p></div>`;
    return;
  }

  el.innerHTML = patients
    .map((patient) => {
      const facility = getFacility(patient.facilityId);
      const pendingCount = (patient.issues || []).filter((issue) => issue.status !== 'resolved').length;
      const age = Number.isFinite(patient.age) ? `Age ${patient.age}` : 'Age not on record';
      const lastVisit = patient.lastVisit ? `Last visit ${formatDate(patient.lastVisit)}` : 'No visits on record';

      return `
        <button type="button" class="client-item" data-patient-id="${patient.id}">
          <span class="client-avatar" aria-hidden="true">${escapeHtml(patient.name.charAt(0))}</span>
          <span class="client-item-copy">
            <strong>${escapeHtml(patient.name)}</strong>
            <small>${escapeHtml(patient.sex)} · ${age} · ${escapeHtml(patient.bloodType)}</small>
            <small>${escapeHtml(facility.name)} · ${lastVisit}</small>
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

  setAddIssueMessage('');
  document.getElementById('client-detail-name').textContent = patient.name;
  const issueCount = (patient.issues || []).length;
  document.getElementById('client-detail-summary').textContent =
    `${patient.sex}, ${Number.isFinite(patient.age) ? `age ${patient.age}` : 'age not on record'} · Health card ${patient.healthCard} · ${issueCount} recorded ${issueCount === 1 ? 'issue' : 'issues'}`;

  const primaryDoctor = getProvider(patient.primaryDoctorId);
  document.getElementById('client-profile').innerHTML = `
    <div><dt>Blood type</dt><dd>${escapeHtml(patient.bloodType || 'Not provided')}</dd></div>
    <div><dt>Age</dt><dd>${Number.isFinite(patient.age) ? patient.age : 'Not on record'}</dd></div>
    <div><dt>Date of birth</dt><dd>${patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not on record'}</dd></div>
    <div><dt>Sex</dt><dd>${escapeHtml(patient.sex)}</dd></div>
    <div><dt>Health card</dt><dd>${escapeHtml(patient.healthCard)}</dd></div>
    <div><dt>Phone</dt><dd>${escapeHtml(patient.phone || 'Not provided')}</dd></div>
    <div><dt>Primary provider</dt><dd>${escapeHtml(primaryDoctor ? primaryDoctor.name : 'Unassigned')}</dd></div>
  `;

  const contactsEl = document.getElementById('client-contacts');
  const contacts = patient.emergencyContacts || [];
  contactsEl.innerHTML = contacts.length
    ? contacts
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
        .join('')
    : '<div class="empty-state"><p>No emergency contacts on record.</p></div>';

  renderClientFacilityMap();
  renderClientFacilityList();
  renderClientSelectedFacility();
  renderClientHistory(patient);
  renderClientAppointments(patient);
}

function renderClientAppointments(patient) {
  const el = document.getElementById('client-appointments');
  if (!el) return;

  const appointments = PROVIDER_SCHEDULE.filter((appointment) => appointment.patientId === patient.id).sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );

  el.innerHTML = appointments.length
    ? appointments
        .map(
          (appointment) => `
            <article class="list-item">
              <div>
                <p class="section-kicker">${escapeHtml(appointment.type)}</p>
                <h4>${formatDate(appointment.date)} at ${escapeHtml(appointment.time)}</h4>
                <p>${escapeHtml(appointment.doctorName || appointment.specialistName || 'Unassigned provider')} · ${escapeHtml(appointment.reason)}</p>
              </div>
              <div class="item-badges">${severityBadge(appointment.severity || 'low')}</div>
            </article>
          `,
        )
        .join('')
    : '<div class="empty-state"><p>No appointments booked for this client.</p></div>';
}

function renderClientHistory(patient) {
  const el = document.getElementById('client-history');
  if (!el) return;

  const sorted = [...(patient.issues || [])].sort((a, b) => b.date.localeCompare(a.date));

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
      const canResolve = issue.type !== 'case' && issue.status !== 'resolved' && issue.id;

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
            ${canResolve ? `<button type="button" class="btn btn-secondary btn-small" data-resolve-issue="${issue.id}">Mark resolved</button>` : ''}
          </div>
        </article>
      `;
    })
    .join('');

  el.querySelectorAll('[data-resolve-issue]').forEach((button) => {
    button.addEventListener('click', () => resolveIssue(button.getAttribute('data-resolve-issue')));
  });
}

async function resolveIssue(symptomId) {
  const patient = getPatient(selectedPatientId);
  if (!patient) return;
  try {
    const response = await fetch('/api/symptoms/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` },
      body: JSON.stringify({ symptomId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    const issue = patient.issues.find((item) => item.id === symptomId);
    if (issue) { issue.status = 'resolved'; issue.resolvedDate = result.resolvedDate; }
    renderClientHistory(patient);
    renderClientList();
  } catch (error) {
    setAddIssueMessage(error.message || 'Could not resolve this issue.');
  }
}

function setAddIssueMessage(message, success = false) {
  const element = document.getElementById('add-issue-message');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('visible', Boolean(message));
  element.style.color = success ? 'var(--success)' : 'var(--danger)';
}

function initAddIssueForm() {
  document.getElementById('add-issue-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedPatientId) return;
    const text = document.getElementById('add-issue-text').value.trim();
    const severity = document.getElementById('add-issue-severity').value;
    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` },
        body: JSON.stringify({ patientId: selectedPatientId, text, severity }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const patient = getPatient(selectedPatientId);
      patient.issues.unshift({ id: result.id, type: 'symptom', text: result.text, severity: result.severity, date: result.date, status: result.status });
      event.target.reset();
      document.getElementById('add-issue-severity').value = 'medium';
      setAddIssueMessage('Issue added.', true);
      renderClientHistory(patient);
      renderClientList();
    } catch (error) {
      setAddIssueMessage(error.message || 'Could not add this issue.');
    }
  });
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
    ${facility.phone ? `<a class="btn btn-sm" href="tel:${facility.phone.replace(/\D/g, '')}">Call facility</a>` : ''}
  `;
}

function renderClientFacilityMap() {
  const el = document.getElementById('client-facility-map');
  if (!el) return;

  const mapped = DEMO_FACILITIES.filter(
    (facility) => Number.isFinite(facility.x) && Number.isFinite(facility.y),
  );

  el.innerHTML = `
    <div class="map-road map-road-one"></div>
    <div class="map-road map-road-two"></div>
    <div class="map-road map-road-three"></div>
    <div class="map-label map-label-north">Downtown Toronto</div>
    <div class="map-label map-label-south">Lake Shore</div>
    ${mapped
      .map(
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
      )
      .join('')}
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

/* ---------- Booking ---------- */

function setBookingMessage(message, success = false) {
  const element = document.getElementById('booking-message');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('visible', Boolean(message));
  element.style.color = success ? 'var(--success)' : 'var(--danger)';
}

function renderBookingPatients() {
  const patientSelect = document.getElementById('booking-patient');
  if (!patientSelect) return;

  const patients = scopedPatients();
  const previous = patientSelect.value;
  patientSelect.innerHTML = patients.length
    ? '<option value="">Select a client…</option>' +
      patients.map((patient) => `<option value="${patient.id}">${escapeHtml(patient.name)}</option>`).join('')
    : '<option value="">No clients available</option>';
  if (patients.some((patient) => patient.id === previous)) patientSelect.value = previous;
}

function renderBookingDoctors() {
  const el = document.getElementById('provider-list');
  if (!el) return;

  const specialty = document.getElementById('specialty-filter')?.value || '';
  const query = (document.getElementById('provider-search')?.value || '').trim().toLowerCase();
  const facilityId = currentProvider().facilityId;

  const matches = HOSPITAL_DOCTORS.filter((doctor) => {
    if (specialty && doctor.specialty !== specialty) return false;
    if (query) {
      const facility = getFacility(doctor.facilityId);
      return `${doctor.name} ${doctor.specialty} ${facility.name}`.toLowerCase().includes(query);
    }
    // Without a search term, keep the list local to the signed-in provider's facility.
    return specialty ? true : doctor.facilityId === facilityId;
  });

  if (!matches.length) {
    el.innerHTML =
      '<div class="empty-state"><p>No providers match this search. Try another specialty or name.</p></div>';
    return;
  }

  const shown = matches.slice(0, PROVIDER_RESULT_LIMIT);
  el.innerHTML =
    shown
      .map((doctor) => {
        const facility = getFacility(doctor.facilityId);
        const isSelected = doctor.id === selectedBookingDoctorId;

        return `
        <button
          type="button"
          class="specialist-card${isSelected ? ' selected' : ''}"
          data-doctor-id="${doctor.id}"
        >
          <span class="specialist-card-header">
            <strong>${escapeHtml(doctor.name)}${doctor.id === PROVIDER_ID ? ' (you)' : ''}</strong>
            ${isSelected ? statusBadge('resolved', 'Selected') : ''}
          </span>
          <span class="specialist-specialty">${escapeHtml(doctor.specialty || 'General practice')}</span>
          <span class="specialist-facility">${escapeHtml(facility.name)}</span>
          <span class="specialist-phone">${escapeHtml(doctor.phone || 'Phone not listed')}</span>
        </button>
      `;
      })
      .join('') +
    (matches.length > shown.length
      ? `<p class="card-description">Showing ${shown.length} of ${matches.length} matches — refine your search to narrow the list.</p>`
      : '');
}

function initBookingForm() {
  const specialtySelect = document.getElementById('specialty-filter');
  const typeSelect = document.getElementById('booking-type');
  const dateInput = document.getElementById('booking-date');

  renderBookingPatients();

  if (specialtySelect) {
    const specialties = [...new Set(HOSPITAL_DOCTORS.map((doctor) => doctor.specialty).filter(Boolean))].sort();
    specialtySelect.innerHTML =
      '<option value="">My facility (all specialties)</option>' +
      specialties.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  }

  if (typeSelect) {
    typeSelect.innerHTML = APPOINTMENT_TYPES.map(
      (type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`,
    ).join('');
  }

  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  specialtySelect?.addEventListener('change', renderBookingDoctors);
  document.getElementById('provider-search')?.addEventListener('input', renderBookingDoctors);
  renderBookingDoctors();

  document.getElementById('provider-list')?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-doctor-id]');
    if (!card) return;
    selectedBookingDoctorId = card.getAttribute('data-doctor-id');
    document.getElementById('booking-doctor').value = selectedBookingDoctorId;
    setBookingMessage('');
    renderBookingDoctors();
  });

  document.getElementById('specialist-booking-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const patientId = document.getElementById('booking-patient').value;
    const doctorId = document.getElementById('booking-doctor').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const type = document.getElementById('booking-type').value;
    const severity = document.getElementById('booking-severity').value;
    const reason = document.getElementById('booking-reason').value.trim();

    const patient = getPatient(patientId);
    const doctor = HOSPITAL_DOCTORS.find((item) => item.id === doctorId);

    if (!patient) return setBookingMessage('Choose a client for this appointment.');
    if (!doctor) return setBookingMessage('Select a provider from the list below.');
    if (!date || !time) return setBookingMessage('Choose a date and time.');
    if (!reason) return setBookingMessage('Add a reason for the appointment.');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` },
        body: JSON.stringify({ patientId, doctorId, date, time, type, reason, severity }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      PROVIDER_SCHEDULE.push({
        date,
        time,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialistName: doctor.name,
        specialty: doctor.specialty,
        facilityId: doctor.facilityId,
        type,
        reason,
        severity,
        status: 'requested',
      });

      event.target.reset();
      selectedBookingDoctorId = null;
      document.getElementById('booking-doctor').value = '';
      document.getElementById('booking-severity').value = 'medium';
      renderBookingPatients();
      renderBookingDoctors();
      renderSchedule();
      renderClientList();
      setBookingMessage(`Appointment booked with ${doctor.name} for ${patient.name}.`, true);
      showPanel('schedule');
    } catch (error) {
      setBookingMessage(error.message || 'Unable to book this appointment.');
    }
  });
}

/* ---------- Schedule ---------- */

function renderSchedule() {
  const el = document.getElementById('schedule-list');
  if (!el) return;

  const appointments = scopedAppointments();
  const today = new Date().toISOString().slice(0, 10);

  const count = document.getElementById('schedule-count');
  if (count) {
    const upcoming = appointments.filter((appointment) => appointment.date >= today).length;
    const past = appointments.length - upcoming;
    count.textContent = `${upcoming} upcoming ${upcoming === 1 ? 'visit' : 'visits'}${
      past ? ` · ${past} completed` : ''
    }`;
  }

  if (!appointments.length) {
    el.innerHTML =
      '<div class="empty-state"><p>No appointments scheduled yet. Use Book an Appointment to add one.</p></div>';
    return;
  }

  el.innerHTML = appointments
    .map((appointment) => {
      const { month, day } = dateParts(appointment.date);
      const isPast = appointment.date < today;
      const providerName = appointment.doctorName || appointment.specialistName || 'Unassigned provider';
      const specialty = appointment.specialty || 'General practice';

      return `
      <article class="appointment-item${isPast ? ' past' : ''}">
        <div class="appointment-date">
          <span>${escapeHtml(month)}</span>
          <strong>${escapeHtml(day)}</strong>
        </div>
        <div class="appointment-details">
          <p class="section-kicker">${escapeHtml(appointment.type)} · ${escapeHtml(specialty)}</p>
          <h3>${escapeHtml(appointment.patientName)} with ${escapeHtml(providerName)}</h3>
          <p>${formatDate(appointment.date)} at ${escapeHtml(appointment.time)}</p>
          <p class="appointment-reason">${escapeHtml(appointment.reason)}</p>
        </div>
        <div class="appointment-status">
          ${severityBadge(appointment.severity || 'low')}
          ${isPast ? statusBadge('pending', 'Completed') : statusBadge('resolved', 'Scheduled')}
        </div>
      </article>
    `;
    })
    .join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  await CAREPATH_DATA_READY;
  renderProviderIdentity();
  initScope();
  renderClientList();
  renderSchedule();
  initPanels();
  initClientList();
  initBookingForm();
  initAddIssueForm();
});
