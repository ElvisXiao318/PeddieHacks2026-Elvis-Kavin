PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS hospitals (
  hospital_id TEXT PRIMARY KEY,
  hospital_name TEXT NOT NULL,
  address TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS doctors (
  doctor_id TEXT PRIMARY KEY,
  doctor_name TEXT NOT NULL,
  hospital_id TEXT NOT NULL REFERENCES hospitals(hospital_id),
  specialty TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS specialists (
  specialist_id TEXT PRIMARY KEY,
  specialist_name TEXT NOT NULL,
  hospital_id TEXT NOT NULL REFERENCES hospitals(hospital_id),
  specialty_type TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS admins (
  admin_id TEXT PRIMARY KEY,
  admin_name TEXT NOT NULL,
  hospital_id TEXT NOT NULL REFERENCES hospitals(hospital_id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_admins (
  site_admin_id TEXT PRIMARY KEY,
  site_admin_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  patient_id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  doctor_id TEXT REFERENCES doctors(doctor_id),
  hospital_id TEXT NOT NULL REFERENCES hospitals(hospital_id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL,
  health_card_number TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  contact_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(doctor_id),
  hospital_id TEXT NOT NULL REFERENCES hospitals(hospital_id),
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS symptoms (
  symptom_id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  symptom_text TEXT NOT NULL, severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending', logged_date TEXT NOT NULL, resolved_date TEXT
);

CREATE TABLE IF NOT EXISTS care_messages (
  message_id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  sender TEXT NOT NULL, subject TEXT NOT NULL, channel TEXT NOT NULL, message_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS care_cases (
  case_id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  title TEXT NOT NULL, status TEXT NOT NULL, updated_date TEXT NOT NULL, note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medications (
  medication_id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL, dosage TEXT NOT NULL, frequency TEXT NOT NULL
);
