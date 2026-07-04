// ClearConnect – Backend Server
// Zustand wird im Arbeitsspeicher gehalten (keine Datenbank nötig).

const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Initialer Zustand ───────────────────────────────────────────────────────
let state     = createInitialState();
let sessions  = [];      // Archiv abgeschlossener Konsultationen
let sessionId = 1;

function createInitialState() {
  return {
    phase:           'welcome',
    patientCategory: null,
    currentQuestion: null,
    currentAnswer:   null,
    conversation:    [],
    summaryRequested: null,
    summaryConfirmed: null,
    diagnosis:        null,
    diagnosisShown:   false,
    startedAt:        null,
  };
}

function nowTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function addMessage(sender, text) {
  state.conversation.push({ sender, text, timestamp: nowTime() });
}

// ─── Endpunkte ───────────────────────────────────────────────────────────────

// GET /api/state
app.get('/api/state', (req, res) => res.json(state));

// GET /api/sessions – Verlauf vergangener Konsultationen
app.get('/api/sessions', (req, res) => res.json(sessions));

// POST /api/category – Patient wählt Besuchsgrund
app.post('/api/category', (req, res) => {
  const { category } = req.body;
  state.patientCategory = category;
  state.phase     = 'waiting';
  state.startedAt = nowTime();
  addMessage('system', `Patient eingecheckt – Anliegen: ${category}`);
  res.json({ ok: true });
});

// POST /api/call-patient – Arzt ruft Patient auf
app.post('/api/call-patient', (req, res) => {
  state.phase = 'called';
  addMessage('system', 'Patient aufgerufen');
  res.json({ ok: true });
});

// POST /api/patient-ready – Patient betritt Zimmer
app.post('/api/patient-ready', (req, res) => {
  state.phase = 'consultation';
  res.json({ ok: true });
});

// POST /api/question – Arzt sendet Frage
app.post('/api/question', (req, res) => {
  const { text, category, type } = req.body;
  state.currentQuestion = { text, category: category || 'Frage', type: type || 'yesno' };
  state.currentAnswer   = null;
  state.diagnosisShown  = false;
  addMessage('doctor', text);
  res.json({ ok: true });
});

// POST /api/answer – Patient antwortet
app.post('/api/answer', (req, res) => {
  const { text } = req.body;
  state.currentAnswer = text;
  addMessage('patient', text);
  res.json({ ok: true });
});

// POST /api/diagnosis – Arzt sendet Diagnose / Abschlussmitteilung
// Patient muss NICHT antworten; diagnosisShown steuert die Patientenansicht.
app.post('/api/diagnosis', (req, res) => {
  const { text } = req.body;
  state.diagnosis      = text;
  state.diagnosisShown = true;
  state.currentQuestion = null;
  state.currentAnswer   = null;
  addMessage('diagnosis', `Arzt-Mitteilung: ${text}`);
  res.json({ ok: true });
});

// POST /api/diagnosis-ack – Patient hat Diagnose gelesen
app.post('/api/diagnosis-ack', (req, res) => {
  state.diagnosisShown = false;
  res.json({ ok: true });
});

// POST /api/finish-consultation – Arzt beendet Gespräch
app.post('/api/finish-consultation', (req, res) => {
  state.phase = 'finishing';
  res.json({ ok: true });
});

// POST /api/summary-request – Patient entscheidet über Zusammenfassung
app.post('/api/summary-request', (req, res) => {
  const { wants } = req.body;
  state.summaryRequested = wants;
  state.phase = wants ? 'summary' : 'done';
  if (!wants) archiveSession();
  res.json({ ok: true });
});

// POST /api/summary-confirm – Patient bestätigt Zusammenfassung
app.post('/api/summary-confirm', (req, res) => {
  const { confirmed } = req.body;
  state.summaryConfirmed = confirmed;
  state.phase = 'done';
  archiveSession();
  res.json({ ok: true });
});

// POST /api/reset – Neue Konsultation
app.post('/api/reset', (req, res) => {
  if (state.phase !== 'welcome') archiveSession();
  state = createInitialState();
  res.json({ ok: true });
});

// ─── Archivierung ─────────────────────────────────────────────────────────────
function archiveSession() {
  if (!state.startedAt) return;
  sessions.unshift({
    id:       sessionId++,
    category: state.patientCategory,
    start:    state.startedAt,
    end:      nowTime(),
    date:     new Date().toLocaleDateString('de-DE'),
    questions: state.conversation.filter(m => m.sender === 'doctor').length,
    diagnosis: state.diagnosis,
    confirmed: state.summaryConfirmed,
  });
  if (sessions.length > 50) sessions.pop();
}

// ─── Server starten ───────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`ClearConnect Backend läuft auf http://localhost:${PORT}`);
});
