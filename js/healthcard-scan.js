/**
 * CarePath — Scan Health Card
 * Reads a photo of a Canadian provincial health card entirely in the browser
 * (via Tesseract.js OCR) and auto-fills the sign-up form's name, date of
 * birth, gender, and health card number fields. Nothing is uploaded — the
 * image never leaves the device. Auto-filled values are always editable and
 * the user is asked to double-check them before submitting.
 */
(function () {
  const MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
  const LABEL_WORDS = /^(HEALTH|CARD|SANTE|SANTÉ|CANADA|ONTARIO|QUEBEC|QUÉBEC|ALBERTA|MANITOBA|CARTE|VALID|EXPIRY|EXPIRES|EXPIRE|ISSUED|SEX|SEXE|DOB|BIRTH|NAISSANCE|NUMBER|NUMÉRO|NO|GOVERNMENT|MINISTRY|INSURANCE|PLAN|PROVINCE)\.?$/i;

  function setStatus(message, state) {
    const el = document.getElementById('scan-status');
    if (!el) return;
    el.className = 'scan-status' + (state ? ` is-${state}` : '');
    el.innerHTML = state === 'busy' ? `<span class="scan-spinner" aria-hidden="true"></span>${message}` : message;
  }

  function markAutofilled(id, value) {
    const el = document.getElementById(id);
    if (!el || !value) return false;
    el.value = value;
    el.classList.remove('autofilled');
    void el.offsetWidth; // restart the flash animation
    el.classList.add('autofilled');
    return true;
  }

  /** Extract a plausible 10–12 digit Canadian health card number. */
  function findHealthCardNumber(text) {
    const candidates = text.match(/\d[\d\s-]{8,15}\d/g) || [];
    for (const raw of candidates) {
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 12) {
        return digits.length === 10
          ? `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
          : digits;
      }
    }
    return null;
  }

  /** Extract a date of birth in YYYY-MM-DD form, for the <input type=date>. */
  function findDateOfBirth(text) {
    const isoLike = text.match(/\b(19|20)\d{2}[\s\/-]?(0[1-9]|1[0-2])[\s\/-]?(0[1-9]|[12]\d|3[01])\b/);
    if (isoLike) {
      const digits = isoLike[0].replace(/\D/g, '');
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    }
    const monthName = text.match(/\b([0-3]?\d)[\s\/-]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s\/-]?((?:19|20)\d{2})\b/i);
    if (monthName) {
      const day = monthName[1].padStart(2, '0');
      const month = MONTHS[monthName[2].toUpperCase()];
      const year = monthName[3];
      return `${year}-${month}-${day}`;
    }
    const dmy = text.match(/\b([0-3]?\d)[\/-]([01]?\d)[\/-]((?:19|20)\d{2})\b/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      return `${dmy[3]}-${month}-${day}`;
    }
    return null;
  }

  /** Extract M/F sex marker mapped to the sign-up form's gender options. */
  function findGender(text) {
    const near = text.match(/SEX[A-Z]?\s*[:\-]?\s*([MF])\b/i) || text.match(/\b(SEX|SEXE)\b[^A-Z0-9]{0,4}([MF])\b/i);
    const letter = (near && (near[2] || near[1]))?.toString().toUpperCase();
    if (letter === 'M') return 'Male';
    if (letter === 'F') return 'Female';
    return null;
  }

  /** Best-effort name guess from two clean, all-letters, non-label lines. */
  function findName(rawText) {
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[A-Za-zÀ-ÿ'\- ]{2,}$/.test(line) && !LABEL_WORDS.test(line));

    if (lines.length === 0) return null;
    if (lines.length === 1) return titleCase(lines[0]);

    // Ontario-style cards typically print SURNAME then GIVEN NAME(S).
    const [first, second] = lines;
    return titleCase(`${second} ${first}`);
  }

  function titleCase(str) {
    return str
      .toLowerCase()
      .replace(/\b[a-zà-ÿ]/g, (c) => c.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function handleFile(file) {
    if (!file) return;

    const previewRow = document.getElementById('scan-preview-row');
    const previewImg = document.getElementById('scan-preview-img');
    const objectUrl = URL.createObjectURL(file);
    previewImg.src = objectUrl;
    previewRow.classList.add('visible');
    setStatus('Reading card…', 'busy');

    if (typeof Tesseract === 'undefined') {
      setStatus('Scanner failed to load. Please enter your details manually.', 'error');
      return;
    }

    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setStatus(`Reading card… ${Math.round(m.progress * 100)}%`, 'busy');
          }
        },
      });

      const text = data.text || '';
      const found = [];

      const healthCard = findHealthCardNumber(text);
      if (markAutofilled('signup-health-card', healthCard)) found.push('health card number');

      const dob = findDateOfBirth(text);
      if (markAutofilled('signup-dob', dob)) found.push('date of birth');

      const gender = findGender(text);
      if (gender) {
        const select = document.getElementById('signup-gender');
        if (select) {
          select.value = gender;
          select.classList.remove('autofilled');
          void select.offsetWidth;
          select.classList.add('autofilled');
          found.push('gender');
        }
      }

      const name = findName(text);
      if (markAutofilled('signup-name', name)) found.push('name');

      if (found.length) {
        setStatus(`Found ${found.join(', ')} — please double-check these fields.`, 'success');
      } else {
        setStatus("Couldn't read the card clearly — please enter your details manually.", 'error');
      }
    } catch (error) {
      setStatus('Scan failed — please enter your details manually.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('scan-dropzone');
    const fileInput = document.getElementById('scan-file-input');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

    ['dragenter', 'dragover'].forEach((evt) =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); })
    );
    ['dragleave', 'drop'].forEach((evt) =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); })
    );
    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    });
  });
})();
