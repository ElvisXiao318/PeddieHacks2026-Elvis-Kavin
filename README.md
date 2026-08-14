# CareConnect Demo

Responsive demo website for **CareConnect** — the organization hub for Canadian hospitals.

## Quick Start

Open `index.html` in a browser, or serve locally:

```bash
npx serve .
```

Then visit `http://localhost:3000`.

## Demo Login

1. Click **Secure Login**
2. Enter any email and a password (4+ characters)
3. Choose **Patient** or **Healthcare Provider**

## Features Included

### Landing Page
- Branding, need statement, patient & provider overviews
- Security & compliance (encryption, PIPEDA, access control)
- Future roadmap (Steps 1–4)

### Accessibility (all pages)
- **Light / Dark mode**
- **Text-to-speech** (browser-dependent)

### Patient Portal
- Future appointments (sample data; full calendar is roadmap Step 2)
- Symptom tracking with manual text entry
- Missed communications log
- Unresolved cases with clear status indicators
- Contact care team (message + callback request)

### Provider Portal
- Comprehensive patient list
- Filter by hospital (placeholder until hospital data is provided)
- Autocomplete for patient search, diagnoses, and medications
- Text-to-speech for patient summaries and notes
- User-friendly dropdown menus

## Not Yet Implemented (by design)

- Canadian hospital directory (awaiting your data)
- Production authentication & encryption backend
- Full calendar/scheduling (roadmap Step 2)
- User feedback sessions (roadmap Step 3)
- Performance monitoring (roadmap Step 4)

## Tech

Static HTML, CSS, and JavaScript — no build step. Mobile-first responsive layout.
