/**
 * CarePath — Shared demo data
 */

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
    primaryDoctorId: 'doc-chen',
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
    id: 'emma-obrien',
    name: "Emma O'Brien",
    bloodType: 'O positive',
    age: 44,
    sex: 'Female',
    healthCard: '****-****-7821',
    facilityId: 'st-michaels',
    primaryDoctorId: 'doc-patel',
    lastVisit: '2026-08-09',
    emergencyContacts: [
      { name: "Patrick O'Brien", relationship: 'Spouse', phone: '(416) 555-0133' },
      { name: 'Emergency services', relationship: 'Immediate danger', phone: '911' },
    ],
    issues: [
      { type: 'symptom', text: 'Persistent lower back pain', severity: 'medium', date: '2026-08-07', status: 'pending' },
      { type: 'case', text: 'Physiotherapy referral', severity: 'low', date: '2026-08-09', status: 'open', note: 'Awaiting scheduling.' },
      { type: 'symptom', text: 'Insomnia', severity: 'low', date: '2026-05-18', status: 'resolved', resolvedDate: '2026-06-01' },
    ],
  },
  {
    id: 'thomas-okoro',
    name: 'Thomas Okoro',
    bloodType: 'B negative',
    age: 31,
    sex: 'Male',
    healthCard: '****-****-4410',
    facilityId: 'st-michaels',
    primaryDoctorId: 'doc-desai',
    lastVisit: '2026-08-03',
    emergencyContacts: [
      { name: 'Grace Okoro', relationship: 'Sister', phone: '(647) 555-0180' },
    ],
    issues: [
      { type: 'case', text: 'Anxiety management follow-up', severity: 'medium', date: '2026-08-03', status: 'open', note: 'Monthly psychiatry check-in.' },
      { type: 'symptom', text: 'Sleep disruption', severity: 'medium', date: '2026-07-25', status: 'pending' },
      { type: 'symptom', text: 'Work-related stress', severity: 'low', date: '2026-04-02', status: 'resolved', resolvedDate: '2026-05-10' },
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
    primaryDoctorId: 'doc-vasquez',
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
    primaryDoctorId: 'doc-moore',
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
    primaryDoctorId: 'doc-bergeron',
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

const HOSPITAL_DOCTORS = [
  { id: 'doc-chen', name: 'Dr. Sarah Chen', specialty: 'Family medicine', facilityId: 'st-michaels', phone: '(416) 555-0124' },
  { id: 'doc-desai', name: 'Dr. Anita Desai', specialty: 'Psychiatry', facilityId: 'st-michaels', phone: '(416) 360-4100' },
  { id: 'doc-patel', name: 'Dr. Raj Patel', specialty: 'Internal medicine', facilityId: 'st-michaels', phone: '(416) 555-0148' },
  { id: 'doc-nguyen', name: 'Dr. Linh Nguyen', specialty: 'Emergency medicine', facilityId: 'st-michaels', phone: '(416) 555-0155' },
  { id: 'doc-vasquez', name: 'Dr. Elena Vasquez', specialty: 'Cardiology', facilityId: 'toronto-general', phone: '(416) 340-4800' },
  { id: 'doc-reid', name: 'Dr. Thomas Reid', specialty: 'Gastroenterology', facilityId: 'toronto-general', phone: '(416) 340-3900' },
  { id: 'doc-moore', name: 'Dr. Catherine Moore', specialty: 'Rheumatology', facilityId: 'womens-college', phone: '(416) 323-6200' },
  { id: 'doc-bergeron', name: 'Dr. Sophie Bergeron', specialty: 'Endocrinology', facilityId: 'mount-sinai', phone: '(416) 596-4620' },
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

let HOSPITAL_SCHEDULE = [
  {
    date: '2026-08-18',
    time: '09:30 AM',
    patientId: 'jordan-lee',
    patientName: 'Jordan Lee',
    doctorId: 'doc-chen',
    doctorName: 'Dr. Sarah Chen',
    specialty: 'Family medicine',
    facilityId: 'st-michaels',
    type: 'Follow-up',
    reason: 'Review recent blood work',
    severity: 'low',
  },
  {
    date: '2026-08-19',
    time: '11:00 AM',
    patientId: 'emma-obrien',
    patientName: "Emma O'Brien",
    doctorId: 'doc-patel',
    doctorName: 'Dr. Raj Patel',
    specialty: 'Internal medicine',
    facilityId: 'st-michaels',
    type: 'Consultation',
    reason: 'Lower back pain assessment',
    severity: 'medium',
  },
  {
    date: '2026-08-20',
    time: '10:30 AM',
    patientId: 'jordan-lee',
    patientName: 'Jordan Lee',
    doctorId: 'doc-chen',
    doctorName: 'Dr. Sarah Chen',
    specialty: 'Family medicine',
    facilityId: 'st-michaels',
    type: 'Follow-up',
    reason: 'Discuss medication results',
    severity: 'medium',
  },
  {
    date: '2026-08-21',
    time: '02:30 PM',
    patientId: 'thomas-okoro',
    patientName: 'Thomas Okoro',
    doctorId: 'doc-desai',
    doctorName: 'Dr. Anita Desai',
    specialty: 'Psychiatry',
    facilityId: 'st-michaels',
    type: 'Follow-up',
    reason: 'Anxiety management check-in',
    severity: 'medium',
  },
  {
    date: '2026-08-22',
    time: '08:45 AM',
    patientId: 'jordan-lee',
    patientName: 'Jordan Lee',
    doctorId: 'doc-nguyen',
    doctorName: 'Dr. Linh Nguyen',
    specialty: 'Emergency medicine',
    facilityId: 'st-michaels',
    type: 'Urgent visit',
    reason: 'Dizziness follow-up',
    severity: 'high',
  },
  {
    date: '2026-08-22',
    time: '02:00 PM',
    patientId: 'marcus-wong',
    patientName: 'Marcus Wong',
    doctorId: 'doc-vasquez',
    doctorName: 'Dr. Elena Vasquez',
    specialty: 'Cardiology',
    facilityId: 'toronto-general',
    type: 'Specialist consult',
    reason: 'Chest tightness during exercise',
    severity: 'high',
  },
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

const ADMIN_HOSPITAL_ID = 'st-michaels';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(dateString) {
  const parsed = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Not on record';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

/** Month and day of an ISO date, e.g. { month: 'Aug', day: '18' }. */
function dateParts(dateString) {
  const parsed = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { month: '—', day: '—' };
  return {
    month: new Intl.DateTimeFormat('en-CA', { month: 'short' }).format(parsed),
    day: new Intl.DateTimeFormat('en-CA', { day: 'numeric' }).format(parsed),
  };
}

function severityLabel(severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function severityBadge(severity) {
  return `<span class="severity-badge severity-${severity}">${severityLabel(severity)}</span>`;
}

function getFacility(facilityId) {
  return (
    DEMO_FACILITIES.find((f) => f.id === facilityId) || {
      id: facilityId || 'unknown',
      name: 'Facility not on record',
      type: 'Facility',
      distance: 'Distance unavailable',
      address: 'Address unavailable',
      phone: '',
    }
  );
}

/** A doctor or specialist account by id. */
function getProvider(providerId) {
  return (
    HOSPITAL_DOCTORS.find((doctor) => doctor.id === providerId) ||
    DEMO_SPECIALISTS.find((specialist) => specialist.id === providerId) ||
    null
  );
}

function getDoctorPatients(doctorId) {
  return DEMO_PATIENTS.filter((patient) => patient.primaryDoctorId === doctorId);
}

function getPatient(patientId) {
  return DEMO_PATIENTS.find((p) => p.id === patientId);
}

function getHospitalDoctors(facilityId) {
  return HOSPITAL_DOCTORS.filter((doctor) => doctor.facilityId === facilityId);
}

function getHospitalPatients(facilityId) {
  return DEMO_PATIENTS.filter((patient) => patient.facilityId === facilityId);
}

function getHospitalAppointments(facilityId) {
  return HOSPITAL_SCHEDULE.filter((appointment) => appointment.facilityId === facilityId);
}

function issueStatusBadge(status) {
  if (status === 'resolved') return statusBadge('resolved', 'Resolved');
  if (status === 'open') return statusBadge('open', 'Open');
  return statusBadge('pending', 'Pending');
}

/* Real accounts replace all clinical demo records. Empty data stays empty until it is created. */
const CAREPATH_DATA_READY = fetch('/api/dashboard-data')
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((data) => {
    DEMO_PATIENTS.splice(0, DEMO_PATIENTS.length, ...data.patients);
    HOSPITAL_DOCTORS.splice(0, HOSPITAL_DOCTORS.length, ...data.doctors);
    DEMO_SPECIALISTS.splice(0, DEMO_SPECIALISTS.length, ...data.specialists);
    (data.hospitals || []).forEach((hospital) => {
      if (DEMO_FACILITIES.some((facility) => facility.id === hospital.id)) return;
      DEMO_FACILITIES.push({
        id: hospital.id,
        name: hospital.name,
        type: 'Hospital',
        distance: 'Distance unavailable',
        address: hospital.address || 'Address unavailable',
        phone: hospital.phone || '',
      });
    });
    HOSPITAL_SCHEDULE.splice(0);
    PROVIDER_SCHEDULE.splice(0);
    const token = getStored(STORAGE_KEYS.sessionToken, '');
    if (token && ['admin', 'provider'].includes(getStored(STORAGE_KEYS.role, ''))) {
      return fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => response.ok ? response.json() : [])
        .then((appointments) => {
          HOSPITAL_SCHEDULE.push(...appointments);
          PROVIDER_SCHEDULE.push(...appointments);
        });
    }
  })
  .catch(() => {
    DEMO_PATIENTS.splice(0);
    HOSPITAL_DOCTORS.splice(0);
    DEMO_SPECIALISTS.splice(0);
    HOSPITAL_SCHEDULE.splice(0);
    PROVIDER_SCHEDULE.splice(0);
  });

// ─── Hamilton hospitals ───────────────────────────────────────────────────────

DEMO_FACILITIES.push(
  {
    id: 'hamilton-general',
    name: 'Hamilton General Hospital',
    type: 'Hospital',
    distance: '68 km away',
    address: '237 Barton Street East, Hamilton, ON',
    phone: '(905) 527-4322',
    x: 22,
    y: 55,
  },
  {
    id: 'juravinski',
    name: 'Juravinski Hospital',
    type: 'Hospital',
    distance: '71 km away',
    address: '711 Concession Street, Hamilton, ON',
    phone: '(905) 521-2100',
    x: 42,
    y: 80,
  },
  {
    id: 'st-josephs-hamilton',
    name: "St. Joseph's Healthcare Hamilton",
    type: 'Hospital',
    distance: '69 km away',
    address: '50 Charlton Avenue East, Hamilton, ON',
    phone: '(905) 522-1155',
    x: 68,
    y: 62,
  },
);
