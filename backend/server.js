// ClearConnect – Backend Server
// Zustand wird im Arbeitsspeicher gehalten (keine Datenbank nötig).
//
// Ablauf (Phasen):
//   welcome → waiting → called → consultation
//   → finishing (Arzt erstellt/korrigiert Zusammenfassung)
//   → summary   (Patient:in prüft Zusammenfassung; bei "Nein" zurück zu finishing)
//   → confirmed (Zusammenfassung bestätigt, Arzt sendet Verabschiedung)
//   → done      (Verabschiedung wird angezeigt)

const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Jedes neue Gerät einmal im Terminal melden (z. B. das iPad)
const seenClients = new Set();
app.use((req, res, next) => {
  const ip = (req.ip || '').replace('::ffff:', '');
  if (!seenClients.has(ip)) {
    seenClients.add(ip);
    console.log(`Neues Gerät verbunden: ${ip}`);
  }
  next();
});

// ─── Initialer Zustand ───────────────────────────────────────────────────────
let state     = createInitialState();
let sessions  = [];      // Archiv abgeschlossener Konsultationen
let sessionId = 1;
let counter   = 1;       // fortlaufende IDs für Fragen und Mitteilungen

function createInitialState() {
  return {
    phase:           'welcome',
    patientName:     null,
    patientCategory: null,
    currentQuestion: null,   // { qid, id, text, short, category, type, options, multi, calendar, unit }
    currentAnswer:   null,
    currentMessage:  null,   // { mid, text, requiresAck, exams, appointment, inSummary, acked }
    messages:        [],     // alle gesendeten Mitteilungen (für Zusammenfassung)
    plannedExams:    [],     // zuletzt mitgeteilte Untersuchungen
    conversation:    [],
    summary:         null,   // { text, status: 'sent'|'rejected'|'confirmed', correction }
    farewell:        null,
    startedAt:       null,
  };
}

function nowTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function addMessage(sender, text, extra = {}) {
  state.conversation.push({ sender, text, timestamp: nowTime(), ...extra });
}

// ─── Endpunkte ───────────────────────────────────────────────────────────────

// GET /api/state
app.get('/api/state', (req, res) => res.json(state));

// GET /api/sessions – Verlauf vergangener Konsultationen
app.get('/api/sessions', (req, res) => res.json(sessions));

// POST /api/checkin – Patient:in gibt Namen und Besuchsgrund an
app.post('/api/checkin', (req, res) => {
  const { name, category } = req.body;
  state.patientName     = (name || '').trim() || null;
  state.patientCategory = category;
  state.phase     = 'waiting';
  state.startedAt = nowTime();
  addMessage('system', `Patient:in eingecheckt – ${state.patientName ?? 'ohne Namen'} – Anliegen: ${category}`);
  res.json({ ok: true });
});

// POST /api/category – (älterer Endpunkt, ohne Namen)
app.post('/api/category', (req, res) => {
  state.patientCategory = req.body.category;
  state.phase     = 'waiting';
  state.startedAt = nowTime();
  addMessage('system', `Patient:in eingecheckt – Anliegen: ${req.body.category}`);
  res.json({ ok: true });
});

// POST /api/call-patient – Arzt ruft Patient auf
app.post('/api/call-patient', (req, res) => {
  state.phase = 'called';
  addMessage('system', 'Patient:in aufgerufen');
  res.json({ ok: true });
});

// POST /api/patient-ready – Patient betritt Zimmer
app.post('/api/patient-ready', (req, res) => {
  state.phase = 'consultation';
  addMessage('system', 'Patient:in hat Betreten des Arztzimmers bestätigt');
  res.json({ ok: true });
});

// POST /api/question – Arzt sendet Frage
app.post('/api/question', (req, res) => {
  const { id, text, short, category, type, options, multi, calendar, unit, datePrefix } = req.body;
  state.currentQuestion = {
    qid: counter++, id: id ?? null, text, short: short || null,
    category: category || 'Frage', type: type || 'yesno',
    options: options || null, multi: !!multi, calendar: !!calendar, unit: unit || null,
    datePrefix: datePrefix || null,
  };
  state.currentAnswer  = null;
  state.currentMessage = null;
  addMessage('doctor', text, { short: short || null });
  res.json({ ok: true });
});

// POST /api/answer – Patient antwortet
app.post('/api/answer', (req, res) => {
  const { text } = req.body;
  state.currentAnswer = text;
  addMessage('patient', text);
  res.json({ ok: true });
});

// POST /api/message – Arzt sendet Mitteilung (optional mit Bestätigung, Untersuchungen, Termin)
app.post('/api/message', (req, res) => {
  const { text, requiresAck, exams, appointment, inSummary, summaryText } = req.body;
  const msg = {
    mid: counter++,
    text: (text || '').trim(),
    requiresAck: !!requiresAck,
    exams: Array.isArray(exams) && exams.length ? exams : null,
    appointment: appointment && appointment.date ? appointment : null,
    inSummary: inSummary !== false,
    summaryText: summaryText || null,
    acked: false,
    time: nowTime(),
  };
  state.currentMessage  = msg;
  state.currentQuestion = null;
  state.currentAnswer   = null;
  state.messages.push(msg);
  if (msg.exams) state.plannedExams = msg.exams;

  let log = msg.text;
  if (msg.exams)       log += (log ? ' ' : '') + `[Untersuchungen: ${msg.exams.join(', ')}]`;
  if (msg.appointment) log += ` [${msg.appointment.label || 'Termin'}: ${formatAppointment(msg.appointment)}]`;
  if (msg.requiresAck) log += ' (Bestätigung angefordert)';
  addMessage('message', log);
  res.json({ ok: true });
});

// POST /api/message-ack – Patient hat Mitteilung gelesen / bestätigt oder abgelehnt
//   Body: { accepted: true|false, comment: '...' }  (accepted fehlt → bestätigt)
app.post('/api/message-ack', (req, res) => {
  const m = state.currentMessage;
  if (m && !m.acked) {
    const declined = req.body.accepted === false;
    const comment  = (req.body.comment || '').trim() || null;
    m.acked = true;
    m.declined = declined;
    m.comment = comment;
    const stored = state.messages.find(x => x.mid === m.mid);
    if (stored) Object.assign(stored, { acked: true, declined, comment });
    const text = declined
      ? `✗ Mitteilung abgelehnt${comment ? ': ' + comment : ''}`
      : (m.requiresAck ? '✓ Mitteilung bestätigt' : '✓ Mitteilung gelesen');
    addMessage('patient', text, { ack: true });
  }
  res.json({ ok: true });
});

// POST /api/finish-consultation – Arzt beendet Gespräch → Zusammenfassung erstellen
app.post('/api/finish-consultation', (req, res) => {
  state.phase = 'finishing';
  state.currentQuestion = null;
  state.currentAnswer   = null;
  state.currentMessage  = null;
  addMessage('system', 'Gespräch beendet – Zusammenfassung wird erstellt');
  res.json({ ok: true });
});

// POST /api/summary – Arzt sendet (korrigierte) Zusammenfassung an Patient:in
app.post('/api/summary', (req, res) => {
  const { text } = req.body;
  state.summary = { text: (text || '').trim(), status: 'sent', correction: null };
  state.phase = 'summary';
  addMessage('system', 'Zusammenfassung an Patient:in gesendet');
  res.json({ ok: true });
});

// POST /api/summary-confirm – Patient bestätigt oder meldet Korrektur
app.post('/api/summary-confirm', (req, res) => {
  const { confirmed, correction } = req.body;
  if (!state.summary) return res.json({ ok: false });
  if (confirmed) {
    state.summary.status = 'confirmed';
    state.phase = 'confirmed';
    addMessage('patient', '✓ Zusammenfassung bestätigt', { ack: true });
  } else {
    state.summary.status     = 'rejected';
    state.summary.correction = (correction || '').trim() || null;
    state.phase = 'finishing';
    addMessage('patient', `Zusammenfassung nicht korrekt${state.summary.correction ? ': ' + state.summary.correction : ''}`);
  }
  res.json({ ok: true });
});

// POST /api/farewell – Arzt sendet Verabschiedung → Konsultation abgeschlossen
app.post('/api/farewell', (req, res) => {
  state.farewell = (req.body.text || '').trim();
  state.phase = 'done';
  addMessage('message', `Verabschiedung: ${state.farewell}`);
  archiveSession();
  res.json({ ok: true });
});

// POST /api/reset – Neue Konsultation
app.post('/api/reset', (req, res) => {
  if (state.phase !== 'welcome' && state.phase !== 'done') archiveSession();
  state = createInitialState();
  res.json({ ok: true });
});

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────
function formatAppointment(a) {
  const [y, m, d] = String(a.date).split('-');
  const datum = d ? `${d}.${m}.${y}` : a.date;
  return a.time ? `${datum}, ${a.time} Uhr` : datum;
}

function archiveSession() {
  if (!state.startedAt) return;
  sessions.unshift({
    id:       sessionId++,
    name:     state.patientName,
    category: state.patientCategory,
    start:    state.startedAt,
    end:      nowTime(),
    date:     new Date().toLocaleDateString('de-DE'),
    questions: state.conversation.filter(m => m.sender === 'doctor').length,
    summary:  state.summary?.text ?? null,
    confirmed: state.summary?.status === 'confirmed',
  });
  if (sessions.length > 50) sessions.pop();
}

// ─── Server starten ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ClearConnect Backend läuft auf http://localhost:${PORT}`);
  // Netzwerkadressen ausgeben, damit man weiß, was am iPad einzugeben ist
  const nets = require('os').networkInterfaces();
  Object.values(nets).flat()
    .filter(n => n && (n.family === 'IPv4' || n.family === 4) && !n.internal)
    .forEach(n => console.log(`  iPad (Patient): http://${n.address}:3000/patient   |   Backend: http://${n.address}:${PORT}`));
  if (!Object.values(nets).flat().some(n => n && !n.internal && (n.family === 'IPv4' || n.family === 4))) {
    console.log('  Keine Netzwerkadresse gefunden – ist der Laptop mit dem WLAN verbunden?');
  }
});
