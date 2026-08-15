"""CarePath demo server. Run: python server.py, then open http://localhost:8000."""
import csv
import hashlib
import json
import secrets
import sqlite3
import sys
import uuid
from datetime import date
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

RESOURCE_ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
DATA_ROOT = Path(sys.executable).parent if getattr(sys, "frozen", False) else RESOURCE_ROOT
DB_PATH = DATA_ROOT / "carepath.db"
SESSIONS = {}

HOSPITALS = [
    ("st-michaels", "St. Michael's Hospital", "30 Bond Street, Toronto, ON", "(416) 360-4000"),
    ("toronto-general", "Toronto General Hospital", "200 Elizabeth Street, Toronto, ON", "(416) 340-3111"),
    ("womens-college", "Women's College Hospital", "76 Grenville Street, Toronto, ON", "(416) 323-6400"),
    ("mount-sinai", "Mount Sinai Hospital", "600 University Avenue, Toronto, ON", "(416) 596-4200"),
]

DIRECTORY_PATHS = [
    DATA_ROOT / "hospital_directory.csv",
    Path(r"C:\Users\hp\Downloads\odhf_v1.1 - odhf_v1.1.csv"),
]

def hospital_directory_rows():
    """Read the supplied Open Database of Healthcare Facilities directory when present."""
    source = next((path for path in DIRECTORY_PATHS if path.exists()), None)
    if not source:
        return []
    with source.open(encoding="utf-8-sig", newline="") as csv_file:
        for row in csv.DictReader(csv_file):
            name = (row.get("facility_name") or "").strip()
            if not name:
                continue
            street = " ".join(part for part in [row.get("street_no", "").strip(), row.get("street_name", "").strip()] if part)
            address = ", ".join(part for part in [street, row.get("city", "").strip(), row.get("province", "").upper().strip()] if part)
            yield (f"odhf-{row['index']}", name, address or None, None)

def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection

def initialise_database():
    connection = db()
    connection.executescript((RESOURCE_ROOT / "schema.sql").read_text(encoding="utf-8"))
    connection.executemany("INSERT OR IGNORE INTO hospitals VALUES (?, ?, ?, ?)", HOSPITALS)
    connection.executemany("INSERT OR IGNORE INTO hospitals VALUES (?, ?, ?, ?)", hospital_directory_rows())
    demo_password = hash_password("CarePath2026!")
    hospital_rows = connection.execute("SELECT hospital_id, hospital_name FROM hospitals").fetchall()
    connection.executemany("""INSERT OR IGNORE INTO doctors
        (doctor_id, doctor_name, hospital_id, specialty, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        (f"doctor-{row['hospital_id']}", f"Dr. Care Team — {row['hospital_name']}", row["hospital_id"], "General practice",
         f"provider-{row['hospital_id']}@carepath.demo", demo_password, None) for row in hospital_rows])
    connection.executemany("""INSERT OR IGNORE INTO specialists
        (specialist_id, specialist_name, hospital_id, specialty_type, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        (f"specialist-{row['hospital_id']}", f"Specialist Team — {row['hospital_name']}", row["hospital_id"], "Specialist care",
         f"specialist-{row['hospital_id']}@carepath.demo", demo_password, None) for row in hospital_rows])
    connection.executemany("""INSERT OR IGNORE INTO admins
        (admin_id, admin_name, hospital_id, email, password_hash) VALUES (?, ?, ?, ?, ?)""", [
        (f"admin-{row['hospital_id']}", f"Hospital Administrator — {row['hospital_name']}", row["hospital_id"],
         f"admin-{row['hospital_id']}@carepath.demo", demo_password) for row in hospital_rows])
    connection.executemany("""INSERT OR IGNORE INTO doctors
        (doctor_id, doctor_name, hospital_id, specialty, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        ("doc-chen", "Dr. Sarah Chen", "st-michaels", "Family medicine", "sarah.chen@carepath.demo", demo_password, "(416) 555-0124"),
        ("doc-patel", "Dr. Raj Patel", "st-michaels", "Internal medicine", "raj.patel@carepath.demo", demo_password, "(416) 555-0148"),
        ("doc-vasquez", "Dr. Elena Vasquez", "toronto-general", "Cardiology", "elena.vasquez@carepath.demo", demo_password, "(416) 340-4800"),
    ])
    connection.executemany("""INSERT OR IGNORE INTO specialists
        (specialist_id, specialist_name, hospital_id, specialty_type, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        ("spec-neuro-1", "Dr. James Okonkwo", "toronto-general", "Neurology", "james.okonkwo@carepath.demo", demo_password, "(416) 340-5200"),
        ("spec-ortho-1", "Dr. Priya Sharma", "mount-sinai", "Orthopedics", "priya.sharma@carepath.demo", demo_password, "(416) 596-4500"),
    ])
    connection.execute("""INSERT OR IGNORE INTO admins
        (admin_id, admin_name, hospital_id, email, password_hash) VALUES (?, ?, ?, ?, ?)""",
        ("admin-stm-1", "Morgan Blake", "st-michaels", "admin@carepath.demo", demo_password))
    connection.commit()
    connection.close()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RESOURCE_ROOT), **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        size = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(size).decode("utf-8"))

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == "/api/hospitals":
            connection = db()
            rows = [dict(row) for row in connection.execute("SELECT hospital_id AS id, hospital_name AS name FROM hospitals ORDER BY hospital_name")]
            connection.close()
            return self.send_json(200, rows)
        if parsed_url.path == "/api/doctors":
            hospital_id = parse_qs(parsed_url.query).get("hospitalId", [""])[0]
            connection = db()
            rows = [dict(row) for row in connection.execute("""SELECT doctor_id AS id, doctor_name AS name,
                specialty FROM doctors WHERE hospital_id = ? ORDER BY doctor_name""", (hospital_id,))]
            connection.close()
            return self.send_json(200, rows)
        if self.path == "/api/dashboard-data":
            connection = db()
            patients = [dict(row) for row in connection.execute("""SELECT p.patient_id AS id, p.patient_name AS name,
                p.hospital_id AS facilityId, p.doctor_id AS primaryDoctorId, p.date_of_birth AS dateOfBirth,
                p.gender AS sex, p.health_card_number AS healthCard FROM patients p ORDER BY p.patient_name""")]
            doctors = [dict(row) for row in connection.execute("""SELECT doctor_id AS id, doctor_name AS name,
                specialty, hospital_id AS facilityId, phone FROM doctors ORDER BY doctor_name""")]
            specialists = [dict(row) for row in connection.execute("""SELECT specialist_id AS id, specialist_name AS name,
                specialty_type AS specialty, hospital_id AS facilityId, phone FROM specialists ORDER BY specialist_name""")]
            symptoms_by_patient = {}
            for row in connection.execute("""SELECT symptom_id AS id, patient_id, symptom_text AS text, severity,
                logged_date AS date, status, resolved_date AS resolvedDate FROM symptoms ORDER BY logged_date DESC"""):
                item = dict(row)
                item["type"] = "symptom"
                symptoms_by_patient.setdefault(item.pop("patient_id"), []).append(item)
            connection.close()
            for patient in patients:
                patient.update({"bloodType": "Not provided", "healthCard": "****-****-" + patient["healthCard"][-4:],
                    "issues": symptoms_by_patient.get(patient["id"], []), "emergencyContacts": []})
            return self.send_json(200, {"patients": patients, "doctors": doctors, "specialists": specialists})
        if parsed_url.path.startswith("/api/patients/") and parsed_url.path.endswith("/appointments"):
            patient_id = parsed_url.path.split("/")[-2]
            if not self.authorize_patient(patient_id):
                return self.send_json(403, {"error": "Patient authorization is required."})
            connection = db()
            rows = [dict(row) for row in connection.execute("""SELECT a.appointment_date AS date,
                a.appointment_time AS time, a.appointment_type AS type, a.reason, a.severity, a.status,
                d.doctor_name AS provider FROM appointments a JOIN doctors d ON d.doctor_id = a.doctor_id
                WHERE a.patient_id = ? ORDER BY a.appointment_date, a.appointment_time""", (patient_id,))]
            connection.close()
            return self.send_json(200, rows)
        if parsed_url.path == "/api/appointments":
            token = self.headers.get("Authorization", "").removeprefix("Bearer ")
            session = SESSIONS.get(token, {})
            if session.get("role") not in {"admin", "provider"}:
                return self.send_json(403, {"error": "Staff authorization is required."})
            connection = db()
            rows = [dict(row) for row in connection.execute("""SELECT a.appointment_date AS date, a.appointment_time AS time,
                a.appointment_type AS type, a.reason, a.severity, p.patient_id AS patientId, p.patient_name AS patientName,
                d.doctor_id AS doctorId, d.doctor_name AS doctorName, d.doctor_name AS specialistName, d.specialty,
                a.hospital_id AS facilityId FROM appointments a JOIN patients p ON p.patient_id = a.patient_id
                JOIN doctors d ON d.doctor_id = a.doctor_id ORDER BY a.appointment_date, a.appointment_time""")]
            connection.close()
            return self.send_json(200, rows)
        if urlparse(self.path).path.startswith("/api/patients/"):
            patient_id = urlparse(self.path).path.rsplit("/", 1)[-1]
            if not self.authorize_patient(patient_id):
                return self.send_json(403, {"error": "Patient authorization is required."})
            connection = db()
            row = connection.execute("""SELECT patient_name, date_of_birth, gender, health_card_number,
                hospital_name FROM patients JOIN hospitals USING(hospital_id) WHERE patient_id = ?""", (patient_id,)).fetchone()
            if not row: return self.send_json(404, {"error": "Patient not found."})
            profile = dict(row); profile["health_card_number"] = "****-****-" + profile["health_card_number"][-4:]
            profile["emergency_contacts"] = [dict(contact) for contact in connection.execute("""SELECT contact_name AS name,
                relationship, phone FROM emergency_contacts WHERE patient_id = ? ORDER BY contact_name""", (patient_id,))]
            profile["symptoms"] = [dict(item) for item in connection.execute("""SELECT symptom_id AS id, symptom_text AS text, severity,
                logged_date AS date, status, resolved_date AS resolvedDate FROM symptoms WHERE patient_id = ? ORDER BY logged_date DESC""", (patient_id,))]
            profile["messages"] = [dict(item) for item in connection.execute("""SELECT sender AS 'from', subject, channel,
                message_date AS date FROM care_messages WHERE patient_id = ? ORDER BY message_date DESC""", (patient_id,))]
            profile["cases"] = [dict(item) for item in connection.execute("""SELECT title, status, updated_date AS updated,
                note FROM care_cases WHERE patient_id = ? ORDER BY updated_date DESC""", (patient_id,))]
            profile["medications"] = [dict(item) for item in connection.execute("""SELECT medication_name AS name, dosage,
                frequency FROM medications WHERE patient_id = ? ORDER BY medication_name""", (patient_id,))]
            connection.close()
            return self.send_json(200, profile)
        return super().do_GET()

    def do_POST(self):
        try:
            data = self.read_json()
            if self.path == "/api/signup": return self.signup(data)
            if self.path == "/api/login": return self.login(data)
            if self.path == "/api/appointments": return self.create_appointment(data)
            if self.path == "/api/symptoms": return self.create_symptom(data)
            if self.path == "/api/symptoms/resolve": return self.resolve_symptom(data)
            if self.path == "/api/logout": return self.logout()
            if self.path == "/api/admin/provision": return self.provision(data)
            self.send_json(404, {"error": "Unknown endpoint."})
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid request."})

    def authorize_patient(self, patient_id):
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        session = SESSIONS.get(token, {})
        return session.get("role") == "patient" and session.get("userId") == patient_id

    def logout(self):
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        SESSIONS.pop(token, None)
        self.send_json(200, {"message": "Signed out."})

    def create_symptom(self, data):
        patient_id = data.get("patientId", "").strip()
        text = data.get("text", "").strip()
        severity = data.get("severity", "").strip()
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        session = SESSIONS.get(token, {})
        if not (self.authorize_patient(patient_id) or session.get("role") in {"admin", "provider"}):
            return self.send_json(403, {"error": "Authorization is required."})
        if not text or severity not in {"low", "medium", "high"}:
            return self.send_json(400, {"error": "Provide a symptom and severity."})
        connection = db()
        try:
            if not connection.execute("SELECT 1 FROM patients WHERE patient_id = ?", (patient_id,)).fetchone():
                return self.send_json(400, {"error": "Patient could not be found."})
            symptom_id = f"symptom-{uuid.uuid4().hex[:10]}"
            logged_date = date.today().isoformat()
            connection.execute("INSERT INTO symptoms VALUES (?, ?, ?, ?, 'pending', ?, NULL)",
                (symptom_id, patient_id, text, severity, logged_date))
            connection.commit()
            self.send_json(201, {"id": symptom_id, "text": text, "severity": severity, "date": logged_date, "status": "pending"})
        finally:
            connection.close()

    def resolve_symptom(self, data):
        symptom_id = data.get("symptomId", "").strip()
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        session = SESSIONS.get(token, {})
        if session.get("role") not in {"admin", "provider"}:
            return self.send_json(403, {"error": "Staff authorization is required."})
        if not symptom_id:
            return self.send_json(400, {"error": "A symptom is required."})
        connection = db()
        try:
            if not connection.execute("SELECT 1 FROM symptoms WHERE symptom_id = ?", (symptom_id,)).fetchone():
                return self.send_json(404, {"error": "Issue not found."})
            resolved_date = date.today().isoformat()
            connection.execute("UPDATE symptoms SET status = 'resolved', resolved_date = ? WHERE symptom_id = ?", (resolved_date, symptom_id))
            connection.commit()
            self.send_json(200, {"symptomId": symptom_id, "status": "resolved", "resolvedDate": resolved_date})
        finally:
            connection.close()

    def create_appointment(self, data):
        patient_id = data.get("patientId", "").strip()
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        session = SESSIONS.get(token, {})
        if not (self.authorize_patient(patient_id) or session.get("role") in {"admin", "provider"}):
            return self.send_json(403, {"error": "Authorization is required."})
        appointment_date = data.get("date", "").strip()
        appointment_time = data.get("time", "").strip()
        appointment_type = data.get("type", "").strip()
        reason = data.get("reason", "").strip()
        severity = data.get("severity", "").strip()
        if not all((appointment_date, appointment_time, appointment_type, reason)) or severity not in {"low", "medium", "high"}:
            return self.send_json(400, {"error": "Complete every appointment field."})
        try:
            date.fromisoformat(appointment_date)
        except ValueError:
            return self.send_json(400, {"error": "Choose a valid appointment date."})
        connection = db()
        try:
            patient = connection.execute("""SELECT p.hospital_id, p.doctor_id, d.doctor_name
                FROM patients p JOIN doctors d ON d.doctor_id = p.doctor_id WHERE p.patient_id = ?""", (patient_id,)).fetchone()
            if not patient:
                return self.send_json(400, {"error": "Your primary care team could not be found."})
            doctor_id = data.get("doctorId", "").strip() or patient["doctor_id"]
            doctor = connection.execute("SELECT doctor_id, doctor_name FROM doctors WHERE doctor_id = ?", (doctor_id,)).fetchone()
            if not doctor: return self.send_json(400, {"error": "Choose a valid provider."})
            appointment_id = f"appointment-{uuid.uuid4().hex[:10]}"
            connection.execute("""INSERT INTO appointments
                (appointment_id, patient_id, doctor_id, hospital_id, appointment_date, appointment_time, appointment_type, reason, severity)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (appointment_id, patient_id, doctor["doctor_id"], patient["hospital_id"], appointment_date, appointment_time,
                 appointment_type, reason, severity))
            connection.commit()
            return self.send_json(201, {"id": appointment_id, "date": appointment_date, "time": appointment_time,
                "type": appointment_type, "reason": reason, "severity": severity, "provider": doctor["doctor_name"]})
        finally:
            connection.close()

    def signup(self, data):
        required = ["name", "email", "password", "dateOfBirth", "gender", "healthCard", "hospitalId", "doctorId", "emergencyName", "emergencyRelationship", "emergencyPhone"]
        if any(not str(data.get(field, "")).strip() for field in required):
            return self.send_json(400, {"error": "Please complete every required field."})
        if len(data["password"]) < 8:
            return self.send_json(400, {"error": "Password must be at least 8 characters."})
        try:
            date.fromisoformat(data["dateOfBirth"])
            connection = db()
            hospital = connection.execute("SELECT hospital_id FROM hospitals WHERE hospital_id = ?", (data["hospitalId"],)).fetchone()
            if not hospital: raise ValueError("Please select a valid hospital.")
            doctor = connection.execute("SELECT doctor_id FROM doctors WHERE doctor_id = ? AND hospital_id = ?", (data["doctorId"], data["hospitalId"])).fetchone()
            if not doctor: raise ValueError("Please select a doctor at your chosen hospital.")
            patient_id = f"patient-{uuid.uuid4().hex[:10]}"
            connection.execute("""INSERT INTO patients
                (patient_id, patient_name, doctor_id, hospital_id, email, password_hash, date_of_birth, gender, health_card_number, phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (patient_id, data["name"].strip(), doctor["doctor_id"], data["hospitalId"], data["email"].lower().strip(),
                 hash_password(data["password"]), data["dateOfBirth"], data["gender"], data["healthCard"].strip(), data.get("phone", "").strip()))
            connection.execute("""INSERT INTO emergency_contacts (contact_id, patient_id, contact_name, relationship, phone)
                VALUES (?, ?, ?, ?, ?)""", (f"contact-{uuid.uuid4().hex[:10]}", patient_id, data["emergencyName"].strip(),
                data["emergencyRelationship"].strip(), data["emergencyPhone"].strip()))
            connection.commit(); connection.close()
            session_token = secrets.token_urlsafe(32)
            SESSIONS[session_token] = {"role": "patient", "userId": patient_id}
            self.send_json(201, {"role": "patient", "patientId": patient_id, "name": data["name"].strip(), "sessionToken": session_token})
        except sqlite3.IntegrityError:
            self.send_json(409, {"error": "An account or health card with that information already exists."})
        except ValueError as error:
            self.send_json(400, {"error": str(error)})

    def login(self, data):
        role = data.get("role"); table = {"patient": "patients", "provider": "doctors", "admin": "admins", "specialist": "specialists"}.get(role)
        if not table: return self.send_json(400, {"error": "Select a valid role."})
        connection = db()
        row = connection.execute(f"SELECT * FROM {table} WHERE email = ? AND password_hash = ?", (data.get("email", "").lower().strip(), hash_password(data.get("password", "")))).fetchone()
        connection.close()
        if not row: return self.send_json(401, {"error": "Email, password, or role is incorrect."})
        identifier = row["patient_id"] if role == "patient" else row["doctor_id"] if role == "provider" else row["admin_id"] if role == "admin" else row["specialist_id"]
        session_token = secrets.token_urlsafe(32)
        SESSIONS[session_token] = {"role": "provider" if role == "specialist" else role, "userId": identifier}
        self.send_json(200, {"role": "provider" if role == "specialist" else role, "userId": identifier, "name": row[1], "sessionToken": session_token})

    def provision(self, data):
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        if SESSIONS.get(token, {}).get("role") != "admin":
            return self.send_json(403, {"error": "Administrator authorization is required."})
        record_type = data.get("type")
        name, email, password = (data.get(key, "").strip() for key in ("name", "email", "password"))
        if record_type not in {"hospital", "doctor", "specialist", "admin"} or not name:
            return self.send_json(400, {"error": "Choose a record type and provide a name."})
        connection = db()
        try:
            if record_type == "hospital":
                record_id = f"hospital-{uuid.uuid4().hex[:10]}"
                connection.execute("INSERT INTO hospitals VALUES (?, ?, ?, ?)", (record_id, name, data.get("address", "").strip() or None, data.get("phone", "").strip() or None))
            else:
                hospital_id = data.get("hospitalId", "").strip()
                if not email or len(password) < 8 or not hospital_id or not connection.execute("SELECT 1 FROM hospitals WHERE hospital_id = ?", (hospital_id,)).fetchone():
                    raise ValueError("Name, hospital, email, and an 8-character password are required.")
                record_id = f"{record_type}-{uuid.uuid4().hex[:10]}"
                if record_type == "doctor":
                    connection.execute("INSERT INTO doctors VALUES (?, ?, ?, ?, ?, ?, ?)", (record_id, name, hospital_id, data.get("specialty", "General practice").strip(), email.lower(), hash_password(password), data.get("phone", "").strip() or None))
                elif record_type == "specialist":
                    connection.execute("INSERT INTO specialists VALUES (?, ?, ?, ?, ?, ?, ?)", (record_id, name, hospital_id, data.get("specialty", "Specialist care").strip(), email.lower(), hash_password(password), data.get("phone", "").strip() or None))
                else:
                    connection.execute("INSERT INTO admins VALUES (?, ?, ?, ?, ?)", (record_id, name, hospital_id, email.lower(), hash_password(password)))
            connection.commit()
            self.send_json(201, {"id": record_id, "message": f"{record_type.title()} added successfully."})
        except (sqlite3.IntegrityError, ValueError) as error:
            self.send_json(400, {"error": str(error) if isinstance(error, ValueError) else "That email is already in use."})
        finally:
            connection.close()

if __name__ == "__main__":
    initialise_database()
    print("CarePath running at http://localhost:8000")
    ThreadingHTTPServer(("", 8000), Handler).serve_forever()
