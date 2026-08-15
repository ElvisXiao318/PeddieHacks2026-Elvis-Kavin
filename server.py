"""CareConnect demo server. Run: python server.py, then open http://localhost:8000."""
import csv
import hashlib
import json
import secrets
import sqlite3
import uuid
from datetime import date
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).parent
DB_PATH = ROOT / "careconnect.db"
SESSIONS = {}

HOSPITALS = [
    ("st-michaels", "St. Michael's Hospital", "30 Bond Street, Toronto, ON", "(416) 360-4000"),
    ("toronto-general", "Toronto General Hospital", "200 Elizabeth Street, Toronto, ON", "(416) 340-3111"),
    ("womens-college", "Women's College Hospital", "76 Grenville Street, Toronto, ON", "(416) 323-6400"),
    ("mount-sinai", "Mount Sinai Hospital", "600 University Avenue, Toronto, ON", "(416) 596-4200"),
]

DIRECTORY_PATHS = [
    ROOT / "hospital_directory.csv",
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
    connection.executescript((ROOT / "schema.sql").read_text(encoding="utf-8"))
    connection.executemany("INSERT OR IGNORE INTO hospitals VALUES (?, ?, ?, ?)", HOSPITALS)
    connection.executemany("INSERT OR IGNORE INTO hospitals VALUES (?, ?, ?, ?)", hospital_directory_rows())
    demo_password = hash_password("CareConnect2026!")
    hospital_rows = connection.execute("SELECT hospital_id, hospital_name FROM hospitals").fetchall()
    connection.executemany("""INSERT OR IGNORE INTO doctors
        (doctor_id, doctor_name, hospital_id, specialty, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        (f"doctor-{row['hospital_id']}", f"Dr. Care Team — {row['hospital_name']}", row["hospital_id"], "General practice",
         f"provider-{row['hospital_id']}@careconnect.demo", demo_password, None) for row in hospital_rows])
    connection.executemany("""INSERT OR IGNORE INTO specialists
        (specialist_id, specialist_name, hospital_id, specialty_type, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        (f"specialist-{row['hospital_id']}", f"Specialist Team — {row['hospital_name']}", row["hospital_id"], "Specialist care",
         f"specialist-{row['hospital_id']}@careconnect.demo", demo_password, None) for row in hospital_rows])
    connection.executemany("""INSERT OR IGNORE INTO admins
        (admin_id, admin_name, hospital_id, email, password_hash) VALUES (?, ?, ?, ?, ?)""", [
        (f"admin-{row['hospital_id']}", f"Hospital Administrator — {row['hospital_name']}", row["hospital_id"],
         f"admin-{row['hospital_id']}@careconnect.demo", demo_password) for row in hospital_rows])
    connection.executemany("""INSERT OR IGNORE INTO doctors
        (doctor_id, doctor_name, hospital_id, specialty, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        ("doc-chen", "Dr. Sarah Chen", "st-michaels", "Family medicine", "sarah.chen@careconnect.demo", demo_password, "(416) 555-0124"),
        ("doc-patel", "Dr. Raj Patel", "st-michaels", "Internal medicine", "raj.patel@careconnect.demo", demo_password, "(416) 555-0148"),
        ("doc-vasquez", "Dr. Elena Vasquez", "toronto-general", "Cardiology", "elena.vasquez@careconnect.demo", demo_password, "(416) 340-4800"),
    ])
    connection.executemany("""INSERT OR IGNORE INTO specialists
        (specialist_id, specialist_name, hospital_id, specialty_type, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        ("spec-neuro-1", "Dr. James Okonkwo", "toronto-general", "Neurology", "james.okonkwo@careconnect.demo", demo_password, "(416) 340-5200"),
        ("spec-ortho-1", "Dr. Priya Sharma", "mount-sinai", "Orthopedics", "priya.sharma@careconnect.demo", demo_password, "(416) 596-4500"),
    ])
    connection.execute("""INSERT OR IGNORE INTO admins
        (admin_id, admin_name, hospital_id, email, password_hash) VALUES (?, ?, ?, ?, ?)""",
        ("admin-stm-1", "Morgan Blake", "st-michaels", "admin@careconnect.demo", demo_password))
    connection.commit()
    connection.close()

class Handler(SimpleHTTPRequestHandler):
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
            connection.close()
            for patient in patients:
                patient.update({"bloodType": "Not provided", "healthCard": "****-****-" + patient["healthCard"][-4:], "issues": [], "emergencyContacts": []})
            return self.send_json(200, {"patients": patients, "doctors": doctors, "specialists": specialists})
        if urlparse(self.path).path.startswith("/api/patients/"):
            patient_id = urlparse(self.path).path.rsplit("/", 1)[-1]
            connection = db()
            row = connection.execute("""SELECT patient_name, date_of_birth, gender, health_card_number,
                hospital_name FROM patients JOIN hospitals USING(hospital_id) WHERE patient_id = ?""", (patient_id,)).fetchone()
            if not row: return self.send_json(404, {"error": "Patient not found."})
            profile = dict(row); profile["health_card_number"] = "****-****-" + profile["health_card_number"][-4:]
            profile["emergency_contacts"] = [dict(contact) for contact in connection.execute("""SELECT contact_name AS name,
                relationship, phone FROM emergency_contacts WHERE patient_id = ? ORDER BY contact_name""", (patient_id,))]
            connection.close()
            return self.send_json(200, profile)
        return super().do_GET()

    def do_POST(self):
        try:
            data = self.read_json()
            if self.path == "/api/signup": return self.signup(data)
            if self.path == "/api/login": return self.login(data)
            if self.path == "/api/admin/provision": return self.provision(data)
            self.send_json(404, {"error": "Unknown endpoint."})
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid request."})

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
            self.send_json(201, {"role": "patient", "patientId": patient_id, "name": data["name"].strip()})
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
    print("CareConnect running at http://localhost:8000")
    ThreadingHTTPServer(("", 8000), Handler).serve_forever()
