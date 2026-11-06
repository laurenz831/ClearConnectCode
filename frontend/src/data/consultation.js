// Gemeinsame Daten für Arzt- und Patientenansicht:
// Besuchsgründe, Mitteilungsvorlagen, Untersuchungen, Verabschiedung, Zusammenfassung.

export const KATEGORIE = {
  pain:       'Schmerzen',
  sick:       'Krankmeldung',
  checkup:    'Vorsorgeuntersuchung',
  medication: 'Medikamente',
  other:      'Sonstiges',
};

// Reihenfolge und Symbol der Kacheln am Tablet
export const KATEGORIE_KACHELN = [
  { key: 'pain',       icon: '+' },
  { key: 'sick',       icon: 'K' },
  { key: 'checkup',    icon: 'V' },
  { key: 'medication', icon: 'M' },
  { key: 'other',      icon: '?' },
];

// Für die Begrüßung: "Sie sind heute wegen … hier."
const GRUND_SATZ = {
  pain:       'Schmerzen',
  sick:       'einer Krankschreibung',
  checkup:    'einer Vorsorgeuntersuchung',
  medication: 'Ihrer Medikamente',
  other:      'Ihres Anliegens',
};

function inTagen(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10); // yyyy-mm-dd für <input type="date">
}

// Mitteilungsvorlagen für das Arzt-Dashboard.
// requiresAck = Patient:in muss bestätigen; inSummary = erscheint im Zusammenfassungs-Entwurf.
export function mitteilungsVorlagen(kategorie) {
  return [
    {
      key: 'begruessung', label: 'Begrüßung',
      text: `Willkommen! Sie sind heute wegen ${GRUND_SATZ[kategorie] ?? 'Ihres Anliegens'} hier.`,
      requiresAck: false, inSummary: false,
    },
    {
      key: 'krankschreibung', label: 'Krankschreibung + Kontrolltermin',
      text: 'Sie werden ab heute für drei Tage krankgeschrieben. Bitte kommen Sie zum Kontrolltermin.',
      requiresAck: true, inSummary: true,
      appointment: { label: 'Kontrolltermin', date: inTagen(3), time: '09:00' },
    },
    {
      key: 'zeigen', label: 'Stellen am Körper zeigen',
      text: 'Bitte zeigen Sie mir die betroffenen Stellen an Ihrem Körper. Sie können dabei angezogen bleiben.',
      requiresAck: true, inSummary: false,
    },
    {
      key: 'abtasten', label: 'Abtasten ankündigen',
      text: 'Als nächsten Untersuchungsschritt würde ich die betroffenen Körperstellen abtasten. Im Rollenspiel wird dies nur angekündigt und nicht durchgeführt. Bitte bestätigen Sie, dass Sie die Nachricht verstanden haben.',
      requiresAck: true, inSummary: false,
    },
    {
      key: 'vorgehen', label: 'Weiteres Vorgehen',
      text: 'Eine Ärztin oder ein Arzt muss Sie noch einmal untersuchen. So kann man herausfinden, woher Ihre Beschwerden kommen und welche Behandlung Ihnen helfen kann.\n\nDas Rollenspiel ist nach diesem Gespräch zu Ende. Sie bekommen jetzt eine Zusammenfassung von dem, was Sie erzählt haben.',
      requiresAck: true, inSummary: true,
      summaryText: 'Eine weitere ärztliche Untersuchung wurde besprochen, im Rollenspiel jedoch nicht durchgeführt.',
    },
    {
      key: 'ok', label: 'OK',
      text: 'OK', requiresAck: false, inSummary: false,
    },
  ];
}

export const UNTERSUCHUNGEN = [
  'Blutuntersuchung',
  'Urinuntersuchung',
  'EKG',
  'Blutdruckmessung',
  'Ultraschall',
  'Röntgen',
];

export const VERABSCHIEDUNG =
  'Die Untersuchung ist beendet. Vielen Dank und auf Wiedersehen. Bitte geben Sie das Tablet jetzt an die Testleitung zurück.';
export const FOLGETERMIN_ZUSATZ =
  'Vereinbaren Sie bitte einen Folgetermin zur Befundbesprechung.';

export function formatTermin(a) {
  if (!a || !a.date) return '';
  const [y, m, d] = String(a.date).split('-');
  const datum = d ? `${d}.${m}.${y}` : a.date;
  return a.time ? `${datum}, ${a.time} Uhr` : datum;
}

// Frage-Antwort-Paare aus dem Gesprächsverlauf (nur Fragen, keine Mitteilungen)
export function getQAPaare(conversation) {
  const paare = [];
  let aktuelleQ = null;
  for (const msg of conversation) {
    if (msg.sender === 'doctor') { aktuelleQ = msg; }
    else if (msg.sender === 'patient' && !msg.ack && aktuelleQ) {
      paare.push({ q: aktuelleQ.text, short: aktuelleQ.short, a: msg.text });
      aktuelleQ = null;
    }
  }
  return paare;
}

// Automatischer Entwurf der Zusammenfassung (Arzt kann ihn vor dem Senden anpassen)
export function zusammenfassungsEntwurf(state) {
  const zeilen = [];
  zeilen.push(state.patientName || 'Patient:in');
  zeilen.push(`Besuchsgrund: ${KATEGORIE[state.patientCategory] ?? state.patientCategory ?? '–'}`);

  const paare = getQAPaare(state.conversation);
  if (paare.length) {
    zeilen.push('', 'Ihre Angaben:');
    paare.forEach(p => zeilen.push(`• ${p.short || p.q}: ${p.a}`));
  }

  const mitteilungen = (state.messages || []).filter(m => m.inSummary && (m.text || m.appointment));
  if (mitteilungen.length) {
    zeilen.push('', 'Mitteilungen der Ärztin / des Arztes:');
    mitteilungen.forEach(m => {
      let z = (m.summaryText || m.text).replace(/\s*\n+\s*/g, ' ');
      if (m.appointment) z += ` ${m.appointment.label || 'Termin'}: ${formatTermin(m.appointment)}.`;
      if (m.declined) z += ` (von Patient:in abgelehnt${m.comment ? ': ' + m.comment : ''})`;
      zeilen.push(`• ${z.trim()}`);
    });
  }

  if (state.plannedExams && state.plannedExams.length) {
    zeilen.push('', `Geplante Untersuchungen: ${state.plannedExams.join(', ')}`);
  }
  return zeilen.join('\n');
}

export function initialen(name) {
  if (!name) return 'P';
  return name.trim().split(/\s+/).map(t => t[0]).slice(0, 2).join('').toUpperCase();
}
