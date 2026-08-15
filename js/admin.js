/**
 * CarePath — Hospital admin dashboard
 */

requireAuth('admin');

const hospitalId = ADMIN_HOSPITAL_ID;
const hospital = getFacility(hospitalId);

let selectedDoctorId = null;
let selectedPatientId = null;
let selectedClientFacilityId = null;
let clientSearchQuery = '';

function setProvisionMessage(message, success = false) {
  const element = document.getElementById('provision-message');
  if (!element) return;
  element.textContent = message;
  element.classList.add('visible');
  element.style.color = success ? 'var(--success)' : 'var(--danger)';
}

async function initProvisioning() {
  const hospitalSelect = document.getElementById('provision-hospital');
  try {
    const hospitals = await fetch('/api/hospitals').then((response) => response.json());
    hospitalSelect.innerHTML = '<option value="">Select a hospital…</option>' + hospitals.map((hospital) => `<option value="${hospital.id}">${escapeHtml(hospital.name)}</option>`).join('');
  } catch { hospitalSelect.innerHTML = '<option value="">Hospitals unavailable</option>'; }
  document.getElementById('provision-type')?.addEventListener('change', (event) => {
    const hospital = event.target.value === 'hospital';
    hospitalSelect.disabled = hospital;
    document.querySelectorAll('.provision-staff').forEach((field) => field.style.display = hospital ? 'none' : 'block');
    document.getElementById('provision-email').required = !hospital;
    document.getElementById('provision-password').required = !hospital;
  });
  document.getElementById('provision-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = (id) => document.getElementById(id).value.trim();
    try {
      const response = await fetch('/api/admin/provision', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStored(STORAGE_KEYS.sessionToken, '')}` }, body: JSON.stringify({ type: value('provision-type'), name: value('provision-name'), hospitalId: value('provision-hospital'), specialty: value('provision-specialty'), email: value('provision-email'), password: document.getElementById('provision-password').value, phone: value('provision-phone'), address: value('provision-address') }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setProvisionMessage(result.message, true); event.target.reset();
    } catch (error) { setProvisionMessage(error.message || 'Could not add this record.'); }
  });
}

function appointmentMarkup(appointment) {
  return `
    <article class="appointment-item">
      <div class="appointment-date">
        <span>${formatDate(appointment.date).split(' ')[0]}</span>
        <strong>${formatDate(appointment.date).split(' ')[1].replace(',', '')}</strong>
      </div>
      <div class="appointment-details">
        <p class="section-kicker">${escapeHtml(appointment.type)} · ${escapeHtml(appointment.specialty)}</p>
        <h3>${escapeHtml(appointment.patientName)} with ${escapeHtml(appointment.doctorName)}</h3>
        <p>${formatDate(appointment.date)} at ${escapeHtml(appointment.time)}</p>
        <p class="appointment-reason">${escapeHtml(appointment.reason)}</p>
      </div>
      <div class="appointment-status">
        ${severityBadge(appointment.severity || 'low')}
        ${statusBadge('resolved', 'Scheduled')}
      </div>
    </article>
  `;
}

function renderHospitalSchedule() {
  const el = document.getElementById('hospital-schedule-list');
  if (!el) return;

  const appointments = getHospitalAppointments(hospitalId).sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );

  if (!appointments.length) {
    el.innerHTML = '<div class="empty-state"><p>No appointments scheduled at this hospital.</p></div>';
    return;
  }

  el.innerHTML = appointments.map(appointmentMarkup).join('');
}

function renderDoctorSchedule() {
  const el = document.getElementById('doctor-schedule-list');
  if (!el) return;

  const doctorId = selectedDoctorId || document.getElementById('schedule-doctor-select')?.value;
  if (!doctorId) {
    el.innerHTML = '<div class="empty-state"><p>Select a doctor to view their schedule.</p></div>';
    return;
  }

  const appointments = getHospitalAppointments(hospitalId)
    .filter((appointment) => appointment.doctorId === doctorId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  if (!appointments.length) {
    el.innerHTML = '<div class="empty-state"><p>No appointments scheduled for this doctor.</p></div>';
    return;
  }

  el.innerHTML = appointments.map(appointmentMarkup).join('');
}

function initScheduleViews() {
  const doctors = getHospitalDoctors(hospitalId);
  const select = document.getElementById('schedule-doctor-select');

  if (select) {
    select.innerHTML = doctors
      .map((doctor) => `<option value="${doctor.id}">${escapeHtml(doctor.name)} · ${escapeHtml(doctor.specialty)}</option>`)
      .join('');
    selectedDoctorId = doctors[0]?.id || null;
  }

  select?.addEventListener('change', (event) => {
    selectedDoctorId = event.target.value;
    renderDoctorSchedule();
  });

  document.querySelectorAll('[data-schedule-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-schedule-view');

      document.querySelectorAll('[data-schedule-view]').forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      document.querySelectorAll('.schedule-view-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `schedule-view-${view}`);
      });
    });
  });

  renderDoctorSchedule();
  renderHospitalSchedule();
}

function initAdminBooking() {
  const patients = getHospitalPatients(hospitalId);
  const doctors = getHospitalDoctors(hospitalId);
  const patientSelect = document.getElementById('admin-booking-patient');
  const doctorSelect = document.getElementById('admin-booking-doctor');

  if (patientSelect) {
    patientSelect.innerHTML = patients
      .map((patient) => `<option value="${patient.id}">${escapeHtml(patient.name)}</option>`)
      .join('');
  }

  if (doctorSelect) {
    doctorSelect.innerHTML = doctors
      .map(
        (doctor) =>
          `<option value="${doctor.id}">${escapeHtml(doctor.name)} · ${escapeHtml(doctor.specialty)}</option>`,
      )
      .join('');
  }

  document.getElementById('admin-booking-form')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const patientId = document.getElementById('admin-booking-patient').value;
    const doctorId = document.getElementById('admin-booking-doctor').value;
    const date = document.getElementById('admin-booking-date').value;
    const time = document.getElementById('admin-booking-time').value;
    const type = document.getElementById('admin-booking-type').value;
    const reason = document.getElementById('admin-booking-reason').value.trim();

    const patient = getPatient(patientId);
    const doctor = HOSPITAL_DOCTORS.find((item) => item.id === doctorId);
    if (!patient || !doctor || !date || !time || !type || !reason) return;

    HOSPITAL_SCHEDULE.push({
      date,
      time,
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      facilityId: hospitalId,
      type,
      reason,
      severity: 'medium',
    });
    HOSPITAL_SCHEDULE.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    renderDoctorSchedule();
    renderHospitalSchedule();
    event.target.reset();
    alert(`Appointment booked: ${patient.name} with ${doctor.name}.`);
    showPanel('schedule');
  });
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
}

function renderClientList() {
  const el = document.getElementById('admin-client-list');
  if (!el) return;

  const query = clientSearchQuery.trim().toLowerCase();
  const patients = getHospitalPatients(hospitalId).filter((patient) =>
    `${patient.name} ${patient.healthCard}`.toLowerCase().includes(query),
  );

  if (!patients.length) {
    el.innerHTML = '<div class="empty-state"><p>No clients match your search at this hospital.</p></div>';
    return;
  }

  el.innerHTML = patients
    .map((patient) => {
      const doctor = HOSPITAL_DOCTORS.find((item) => item.id === patient.primaryDoctorId);
      const pendingCount = patient.issues.filter((issue) => issue.status !== 'resolved').length;

      return `
        <button type="button" class="client-item" data-patient-id="${patient.id}">
          <span class="client-avatar" aria-hidden="true">${escapeHtml(patient.name.charAt(0))}</span>
          <span class="client-item-copy">
            <strong>${escapeHtml(patient.name)}</strong>
            <small>${escapeHtml(patient.sex)} · Age ${patient.age} · ${escapeHtml(patient.bloodType)}</small>
            <small>${doctor ? escapeHtml(doctor.name) : 'Unassigned'} · Last visit ${formatDate(patient.lastVisit)}</small>
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
  document.getElementById('admin-client-list-view')?.removeAttribute('hidden');
  document.getElementById('admin-client-detail-view')?.setAttribute('hidden', '');
}

function showClientDetail(patientId) {
  const patient = getPatient(patientId);
  if (!patient || patient.facilityId !== hospitalId) return;

  selectedPatientId = patientId;
  selectedClientFacilityId = patient.facilityId;

  document.getElementById('admin-client-list-view')?.setAttribute('hidden', '');
  document.getElementById('admin-client-detail-view')?.removeAttribute('hidden');

  document.getElementById('admin-client-detail-name').textContent = patient.name;
  document.getElementById('admin-client-detail-summary').textContent =
    `${patient.sex}, age ${patient.age} · Health card ${patient.healthCard} · ${patient.issues.length} recorded issues`;

  document.getElementById('admin-client-profile').innerHTML = `
    <div><dt>Blood type</dt><dd>${escapeHtml(patient.bloodType)}</dd></div>
    <div><dt>Age</dt><dd>${patient.age}</dd></div>
    <div><dt>Sex</dt><dd>${escapeHtml(patient.sex)}</dd></div>
    <div><dt>Health card</dt><dd>${escapeHtml(patient.healthCard)}</dd></div>
  `;

  document.getElementById('admin-client-contacts').innerHTML = patient.emergencyContacts
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

function renderClientHistory(patient) {
  const el = document.getElementById('admin-client-history');
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
  const el = document.getElementById('admin-client-selected-facility');
  const label = document.getElementById('admin-client-facility-label');
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
  const el = document.getElementById('admin-client-facility-map');
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
  const el = document.getElementById('admin-client-facility-list');
  if (!el) return;

  const query = filter.trim().toLowerCase();
  const facilities = DEMO_FACILITIES.filter((item) =>
    `${item.name} ${item.type} ${item.address}`.toLowerCase().includes(query),
  );

  el.innerHTML = facilities.length
    ? facilities
        .map(
          (item) => `
            <button
              type="button"
              class="facility-item${item.id === selectedClientFacilityId ? ' active' : ''}"
              data-facility-id="${item.id}"
            >
              <span class="facility-icon" aria-hidden="true">+</span>
              <span class="facility-item-copy">
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.type)} · ${escapeHtml(item.distance)}</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          `,
        )
        .join('')
    : '<div class="empty-state"><p>No facilities match your search.</p></div>';
}

function highlightClientFacility(facilityId) {
  if (!DEMO_FACILITIES.some((item) => item.id === facilityId)) return;
  selectedClientFacilityId = facilityId;
  renderClientSelectedFacility();
  renderClientFacilityMap();
  renderClientFacilityList(document.getElementById('admin-client-facility-search')?.value || '');
}

function initClientList() {
  document.getElementById('admin-client-search')?.addEventListener('input', (event) => {
    clientSearchQuery = event.target.value;
    renderClientList();
  });

  document.getElementById('admin-client-list')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-patient-id]');
    if (button) showClientDetail(button.getAttribute('data-patient-id'));
  });

  document.getElementById('admin-back-to-clients')?.addEventListener('click', hideClientDetail);

  document.getElementById('admin-client-facility-search')?.addEventListener('input', (event) => {
    renderClientFacilityList(event.target.value);
  });

  document.getElementById('admin-client-facility-list')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-facility-id]');
    if (button) highlightClientFacility(button.getAttribute('data-facility-id'));
  });

  document.getElementById('admin-client-facility-map')?.addEventListener('click', (event) => {
    const marker = event.target.closest('[data-facility-id]');
    if (marker) highlightClientFacility(marker.getAttribute('data-facility-id'));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await CAREPATH_DATA_READY;
  const title = document.getElementById('admin-hospital-name');
  if (title) title.textContent = hospital.name;

  initPanels();
  initScheduleViews();
  initAdminBooking();
  initClientList();
  initProvisioning();
  renderClientList();
});
