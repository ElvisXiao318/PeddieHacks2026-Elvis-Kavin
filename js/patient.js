/**
 * CareConnect — Patient dashboard
 */

requireAuth('patient');

const DEMO_APPOINTMENTS = [
  { date: '2026-08-20', time: '10:30 AM', provider: 'Dr. Sarah Chen', type: 'Follow-up' },
  { date: '2026-09-03', time: '2:00 PM', provider: 'Dr. Sarah Chen', type: 'Lab review' },
];

const DEMO_SYMPTOMS = [
  { text: 'Intermittent dizziness when standing', severity: 'moderate', date: '2026-08-10' },
];

const DEMO_MISSED = [
  { from: 'Dr. Sarah Chen', date: '2026-08-08', subject: 'Lab results follow-up', channel: 'Secure message' },
];

const DEMO_CASES = [
  { title: 'Lab results review', status: 'open', updated: '2026-08-12', note: 'Awaiting provider review of blood work.' },
  { title: 'Medication adjustment request', status: 'pending', updated: '2026-08-11', note: 'Provider reviewing dosage change.' },
];

const DEMO_MEDICATIONS = [
  { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily' },
  { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily' },
];

function renderAppointments() {
  const el = document.getElementById('appointments-list');
  if (!el) return;
  if (!DEMO_APPOINTMENTS.length) {
    el.innerHTML = '<div class="list-item"><p>No upcoming appointments.</p></div>';
    return;
  }
  el.innerHTML = DEMO_APPOINTMENTS.map((a) => `
    <div class="list-item">
      <div>
        <h4>${a.type} — ${a.provider}</h4>
        <p>${a.date} at ${a.time}</p>
      </div>
      ${statusBadge('resolved', 'Scheduled')}
    </div>
  `).join('');
}

function renderSymptoms() {
  const el = document.getElementById('symptoms-list');
  if (!el) return;
  if (!DEMO_SYMPTOMS.length) {
    el.innerHTML = '<div class="list-item"><p>No symptoms logged yet.</p></div>';
    return;
  }
  el.innerHTML = DEMO_SYMPTOMS.map((s) => `
    <div class="list-item">
      <div>
        <h4>${s.text}</h4>
        <p>Logged ${s.date} · Severity: ${s.severity}</p>
      </div>
      ${statusBadge('open', 'Tracking')}
    </div>
  `).join('');
}

function renderMissed() {
  const el = document.getElementById('missed-list');
  if (!el) return;
  if (!DEMO_MISSED.length) {
    el.innerHTML = '<div class="list-item"><p>No missed communications.</p></div>';
    return;
  }
  el.innerHTML = DEMO_MISSED.map((m) => `
    <div class="list-item">
      <div>
        <h4>${m.subject}</h4>
        <p>From ${m.from} · ${m.date} · ${m.channel}</p>
      </div>
      ${statusBadge('pending', 'Missed')}
    </div>
  `).join('');
}

function renderCases() {
  const el = document.getElementById('cases-list');
  if (!el) return;
  if (!DEMO_CASES.length) {
    el.innerHTML = '<div class="list-item"><p>No pending cases.</p></div>';
    return;
  }
  el.innerHTML = DEMO_CASES.map((c) => {
    const badge = c.status === 'open' ? statusBadge('open', 'Open')
      : c.status === 'pending' ? statusBadge('pending', 'Pending')
      : statusBadge('resolved', 'Resolved');
    return `
      <div class="list-item">
        <div>
          <h4>${c.title}</h4>
          <p>${c.note} · Updated ${c.updated}</p>
        </div>
        ${badge}
      </div>
    `;
  }).join('');
}

function renderMedications() {
  const el = document.getElementById('medications-list');
  if (!el) return;
  el.innerHTML = DEMO_MEDICATIONS.map((m) => `
    <div class="list-item">
      <div>
        <h4>${m.name}</h4>
        <p>${m.dosage} · ${m.frequency}</p>
      </div>
    </div>
  `).join('');
}

function initPanels() {
  document.querySelectorAll('.sidebar nav button[data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-panel');
      document.querySelectorAll('.sidebar nav button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      document.getElementById(`panel-${panelId}`)?.classList.add('active');
    });
  });
}

function initSymptomForm() {
  document.getElementById('symptom-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('symptom-input').value.trim();
    const severity = document.getElementById('symptom-severity').value;
    if (!text) return;
    DEMO_SYMPTOMS.unshift({
      text,
      severity,
      date: new Date().toISOString().slice(0, 10),
    });
    document.getElementById('symptom-input').value = '';
    renderSymptoms();
  });
}

function initAppointmentForm() {
  document.getElementById('appointment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('appt-type');
    const date = document.getElementById('appt-date').value;
    const time = document.getElementById('appt-time').value;
    const typeLabel = type.options[type.selectedIndex].text;

    DEMO_APPOINTMENTS.push({
      date,
      time,
      provider: 'Dr. Sarah Chen',
      type: typeLabel,
    });
    DEMO_APPOINTMENTS.sort((a, b) => a.date.localeCompare(b.date));

    renderAppointments();
    e.target.reset();
    alert('Appointment request submitted. (Demo — no backend connected.)');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCases();
  renderMissed();
  renderAppointments();
  renderMedications();
  renderSymptoms();
  initPanels();
  initSymptomForm();
  initAppointmentForm();
});
