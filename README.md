# CarePath Demo

Responsive demo website for **CarePath** — the organization hub for Canadian hospitals.

## Quick Start

The easiest option is to double-click **CarePath.exe**, then open `http://localhost:8000`. The executable includes the required Python runtime, so users do not need to install Python.

Or, for local development, install Python 3 and start the app from this folder:

```bash
python server.py
```

Then visit `http://localhost:8000`. Do not open the HTML files directly: account creation and login use the local API.

## Demo Login

1. Click **Create Patient Account** to add a stored patient account. The form collects name, age (via date of birth), gender, health-card number, phone, and hospital.
2. To log in as seeded staff, use password `CarePath2026!`:
   - Provider: `sarah.chen@carepath.demo`
   - Admin: `admin@carepath.demo`

## Data storage

`server.py` creates `carepath.db` using `schema.sql`. It contains interconnected `hospitals`, `doctors`, `specialists`, `admins`, and `patients` tables. Hospital and staff records are safely seeded on first run; newly registered patient accounts persist in the database.

The hospital table imports the supplied Open Database of Healthcare Facilities CSV (`C:\Users\hp\Downloads\odhf_v1.1 - odhf_v1.1.csv`) when the server starts. To make the project portable, copy that file beside `server.py` and rename it `hospital_directory.csv`; it is preferred automatically. The original directory includes 3,367 facilities plus its header row.

## Features Included

### Landing Page
- Branding, need statement, patient & provider overviews
- Security & compliance (encryption, PIPEDA, access control)
- Future roadmap (Steps 1–4)

### Accessibility (all pages)
- **Light / Dark mode**
- **Text-to-speech** (browser-dependent)

### Patient Portal
- Overview tab with upcoming appointments first
- Personal information card with blood type, age, sex, and health card number
- Main care facility selector with a draggable and zoomable map
- Hospital selection that centers the chosen facility on the map
- Google Maps directions link for the selected facility
- Searchable nearby facility list
- Symptoms / Issues tab with Pending and Resolved status views
- Appointment booking with date, time, reason, and severity level

### Provider Portal
- Comprehensive patient list
- Filter by hospital (placeholder until hospital data is provided)
- Autocomplete for patient search, diagnoses, and medications
- Text-to-speech for patient summaries and notes
- User-friendly dropdown menus

## Not Yet Implemented (by design)

- Canadian hospital directory (awaiting your data)
- Production authentication, encryption, and health-data compliance review (this local demo hashes passwords but is not production-ready)
- Full calendar/scheduling (roadmap Step 2)
- User feedback sessions (roadmap Step 3)
- Performance monitoring (roadmap Step 4)

## Tech

Static HTML, CSS, and JavaScript — no build step. Mobile-first responsive layout.
