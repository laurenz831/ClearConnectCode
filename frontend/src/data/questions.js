// Fragebibliothek für das Arzt-Dashboard.
//
// Typen:
//   'yesno'    → Patient sieht Ja / Nein Buttons (+ Freitext)
//   'scale'    → Patient sieht VAS-Skala 0–10
//   'text'     → Patient sieht nur ein Textfeld
//   'body'     → Patient sieht Körpermodell (mit vergrößerter Ansicht für Rücken und Füße)
//   'calendar' → Patient sieht Kalender (Datum wählen)
//   'choice'   → Patient sieht Auswahl-Buttons (options); multi = Mehrfachauswahl,
//                calendar = zusätzlich "Datum im Kalender wählen"
//   'number'   → Patient sieht Zahleneingabe mit Einheit (unit)
//
// short = kurze Bezeichnung für die automatisch erstellte Zusammenfassung.

const SEIT_WANN = ['Heute Morgen', 'Heute im Laufe des Tages', 'Seit gestern', 'Seit einigen Tagen', 'Seit über einer Woche'];

const questions = [
  // ── ANLIEGEN & BESCHWERDEN ────────────────────────────
  {
    category: 'Anliegen & Beschwerden',
    icon: 'B',
    items: [
      { id: 200, text: 'Welche Beschwerden haben Sie?',                 type: 'text',   short: 'Beschwerden' },
      { id: 201, text: 'Haben Sie aktuell Beschwerden?',                type: 'yesno',  short: 'Aktuelle Beschwerden' },
      { id: 202, text: 'Seit wann haben Sie diese Beschwerden?',        type: 'choice', short: 'Beginn der Beschwerden', options: SEIT_WANN, calendar: true, datePrefix: 'Seit' },
      { id: 203, text: 'Hatten Sie solche Beschwerden schon einmal?',   type: 'yesno',  short: 'Frühere Beschwerden' },
      { id: 204, text: 'Haben Sie Fragen zu Ihren Beschwerden?',        type: 'text',   short: 'Fragen der Patientin / des Patienten' },
    ],
  },

  // ── KRANKMELDUNG ──────────────────────────────────────
  {
    category: 'Krankmeldung',
    icon: 'K',
    items: [
      { id: 205, text: 'Ab wann möchten Sie die Krankmeldung?',         type: 'choice', short: 'Krankmeldung ab', options: ['Ab gestern', 'Ab heute', 'Ab morgen'], calendar: true, datePrefix: 'Ab' },
      { id: 206, text: 'Benötigen Sie Medikamente?',                    type: 'yesno',  short: 'Medikamentenbedarf' },
    ],
  },

  // ── PERSÖNLICHE ANGABEN ───────────────────────────────
  {
    category: 'Persönliche Angaben',
    icon: 'I',
    items: [
      { id: 210, text: 'Wie alt sind Sie?',                             type: 'number', short: 'Alter',   unit: 'Jahre' },
      { id: 211, text: 'Welches Geschlecht geben Sie an?',              type: 'choice', short: 'Geschlecht', options: ['Männlich', 'Weiblich', 'Divers', 'Keine Angabe'] },
      { id: 212, text: 'Wie groß sind Sie?',                            type: 'number', short: 'Größe',   unit: 'cm' },
      { id: 213, text: 'Wie viel wiegen Sie?',                          type: 'number', short: 'Gewicht', unit: 'kg' },
      { id: 214, text: 'Was machen Sie beruflich?',                     type: 'choice', short: 'Beruf', options: ['Berufstätig', 'In Ausbildung / Studium', 'Pensioniert', 'Derzeit ohne Arbeit'] },
    ],
  },

  // ── SCHMERZORT ────────────────────────────────────────
  {
    category: 'Schmerzort',
    icon: 'O',
    items: [
      { id: 1,  text: 'Wo haben Sie Schmerzen? Bitte markieren Sie die Stelle im Körperbild.', type: 'body', short: 'Schmerzort' },
      { id: 2,  text: 'Haben Sie Schmerzen in der Brust?',              type: 'yesno' },
      { id: 3,  text: 'Haben Sie Schmerzen im Bauch?',                  type: 'yesno' },
      { id: 4,  text: 'Haben Sie Schmerzen im Kopf?',                   type: 'yesno' },
      { id: 5,  text: 'Haben Sie Rückenschmerzen?',                     type: 'yesno' },
      { id: 6,  text: 'Strahlen die Schmerzen in andere Stellen aus?',  type: 'yesno', short: 'Ausstrahlung' },
      { id: 7,  text: 'Bitte zeigen Sie mir, wo die Schmerzen am stärksten sind.', type: 'body', short: 'Stärkster Schmerz' },
    ],
  },

  // ── SCHMERZCHARAKTER ──────────────────────────────────
  {
    category: 'Schmerzcharakter',
    icon: 'S',
    items: [
      { id: 230, text: 'Wie fühlen sich die Schmerzen an?',             type: 'choice', short: 'Schmerzart', options: ['Stechend', 'Brennend', 'Dumpf', 'Drückend', 'Ziehend', 'Pochend', 'Krampfartig'], multi: true },
      { id: 231, text: 'Seit wann haben Sie die Schmerzen?',            type: 'choice', short: 'Beginn der Schmerzen', options: SEIT_WANN, calendar: true, datePrefix: 'Seit' },
      { id: 232, text: 'Haben die Schmerzen plötzlich oder langsam begonnen?', type: 'choice', short: 'Art des Beginns', options: ['Plötzlich', 'Langsam'] },
      { id: 233, text: 'Wann treten die Schmerzen auf?',                type: 'choice', short: 'Auftreten', options: ['In Ruhe', 'Bei Bewegung', 'Bei Belastung', 'Nachts', 'Nach dem Essen', 'Dauerhaft'], multi: true },
      { id: 10, text: 'Wie stark sind die Schmerzen?',                  type: 'scale',  short: 'Schmerzstärke' },
      { id: 11, text: 'Sind die Schmerzen heute stärker als gestern?',  type: 'yesno' },
      { id: 12, text: 'Fällt es Ihnen wegen der Schmerzen schwer zu schlafen?', type: 'yesno' },
      { id: 15, text: 'Kommen die Schmerzen in Wellen?',                type: 'yesno' },
      { id: 16, text: 'Haben die Schmerzen Sie heute Nacht aufgeweckt?', type: 'yesno' },
      { id: 22, text: 'Hatten Sie diese Schmerzen schon früher?',       type: 'yesno' },
      { id: 23, text: 'Sind die Schmerzen dauerhaft oder kommen und gehen sie?', type: 'choice', options: ['Dauerhaft', 'Kommen und gehen'] },
    ],
  },

  // ── EMPFINDUNG / NERVEN ───────────────────────────────
  {
    category: 'Empfindung',
    icon: 'N',
    items: [
      { id: 240, text: 'Spüren Sie ein Kribbeln?',                      type: 'yesno', short: 'Kribbeln' },
      { id: 241, text: 'Wo spüren Sie das Kribbeln? Bitte markieren Sie die betroffenen Stellen.', type: 'body', short: 'Ort des Kribbelns' },
      { id: 242, text: 'Spüren Sie Berührungen an diesen Stellen anders als sonst?', type: 'body', short: 'Veränderte Berührungswahrnehmung' },
      { id: 39,  text: 'Haben Sie ein Taubheitsgefühl?',                type: 'yesno', short: 'Taubheitsgefühl' },
    ],
  },

  // ── VORSORGE / CHECK-UP ───────────────────────────────
  {
    category: 'Vorsorge',
    icon: 'P',
    items: [
      { id: 220, text: 'Ist dies Ihr erster Termin zur Vorsorgeuntersuchung in unserer Praxis?', type: 'yesno', short: 'Erster Vorsorgetermin' },
      { id: 221, text: 'Haben Sie bekannte Vorerkrankungen?',           type: 'yesno', short: 'Bekannte Vorerkrankungen' },
      { id: 60,  text: 'Nehmen Sie regelmäßig Medikamente ein?',        type: 'yesno', short: 'Regelmäßige Medikamente' },
      { id: 222, text: 'Sind in Ihrer Familie Erkrankungen wie Herzinfarkt, Diabetes oder Krebs bekannt?', type: 'yesno', short: 'Erkrankungen in der Familie' },
      { id: 92,  text: 'Rauchen Sie?',                                  type: 'yesno', short: 'Rauchen' },
      { id: 93,  text: 'Wie häufig trinken Sie Alkohol: nie, gelegentlich oder regelmäßig?', type: 'choice', short: 'Alkohol', options: ['Nie', 'Gelegentlich', 'Regelmäßig'] },
      { id: 94,  text: 'Wie häufig sind Sie körperlich aktiv?',         type: 'choice', short: 'Körperliche Aktivität', options: ['Nie', 'Seltener als 1x pro Woche', '1–3x pro Woche', 'Mehr als 3x pro Woche'] },
      { id: 223, text: 'Möchten Sie weitere Untersuchungen durchführen lassen?', type: 'text', short: 'Weitere Untersuchungswünsche' },
      { id: 90,  text: 'Wann war Ihre letzte Blutuntersuchung?',        type: 'calendar' },
      { id: 91,  text: 'Haben Sie Ihren Blutdruck in letzter Zeit gemessen?', type: 'yesno' },
      { id: 95,  text: 'Haben Sie Stress im Alltag?',                   type: 'yesno' },
    ],
  },

  // ── ALLGEMEINZUSTAND ──────────────────────────────────
  {
    category: 'Allgemeinzustand',
    icon: 'A',
    items: [
      { id: 30, text: 'Fühlen Sie sich müde oder erschöpft?',           type: 'yesno' },
      { id: 31, text: 'Haben Sie Fieber?',                              type: 'yesno' },
      { id: 32, text: 'Haben Sie Husten?',                              type: 'yesno' },
      { id: 33, text: 'Haben Sie Atemnot?',                             type: 'yesno' },
      { id: 34, text: 'Haben Sie Schwindel?',                           type: 'yesno' },
      { id: 35, text: 'Übelkeit oder Erbrechen?',                       type: 'yesno' },
      { id: 36, text: 'Haben Sie Appetit?',                             type: 'yesno' },
      { id: 37, text: 'Haben Sie in letzter Zeit an Gewicht verloren?', type: 'yesno' },
      { id: 38, text: 'Können Sie sich normal bewegen?',                type: 'yesno' },
    ],
  },

  // ── VERDAUUNG / AUSSCHEIDUNG ──────────────────────────
  {
    category: 'Verdauung',
    icon: 'V',
    items: [
      { id: 40, text: 'Haben Sie Probleme beim Wasserlassen?',          type: 'yesno' },
      { id: 41, text: 'Haben Sie Durchfall oder Verstopfung?',          type: 'yesno' },
      { id: 42, text: 'Haben Sie Blut im Stuhl bemerkt?',               type: 'yesno' },
      { id: 43, text: 'Haben Sie Magenschmerzen nach dem Essen?',       type: 'yesno' },
    ],
  },

  // ── HERZ / KREISLAUF ──────────────────────────────────
  {
    category: 'Herz & Kreislauf',
    icon: 'H',
    items: [
      { id: 50, text: 'Haben Sie Herzrasen oder unregelmäßigen Herzschlag?', type: 'yesno' },
      { id: 51, text: 'Haben Sie Schmerzen in der Brust bei Belastung?', type: 'yesno' },
      { id: 52, text: 'Schwellen Ihre Beine an?',                        type: 'yesno' },
      { id: 53, text: 'Haben Sie Kurzatmigkeit beim Treppensteigen?',    type: 'yesno' },
    ],
  },

  // ── MEDIKAMENTE ───────────────────────────────────────
  {
    category: 'Medikamente',
    icon: 'M',
    items: [
      { id: 61, text: 'Haben Sie Ihre Medikamente heute genommen?',      type: 'yesno' },
      { id: 62, text: 'Haben Sie Nebenwirkungen bei Ihren Medikamenten?', type: 'yesno' },
      { id: 63, text: 'Haben Sie Schmerzmittel eingenommen?',            type: 'yesno' },
      { id: 64, text: 'Wann haben Sie zuletzt Schmerzmittel genommen?',  type: 'calendar' },
      { id: 65, text: 'Sind die Schmerzmittel wirksam?',                 type: 'yesno' },
    ],
  },

  // ── VORGESCHICHTE ─────────────────────────────────────
  {
    category: 'Vorgeschichte',
    icon: 'G',
    items: [
      { id: 70, text: 'Waren Sie in letzter Zeit im Krankenhaus?',       type: 'yesno' },
      { id: 71, text: 'Wann waren Sie zuletzt beim Arzt?',               type: 'calendar' },
      { id: 73, text: 'Wurden Sie jemals operiert?',                     type: 'yesno' },
      { id: 74, text: 'Haben Sie Allergien?',                            type: 'yesno' },
    ],
  },

  // ── PSYCHISCHES WOHLBEFINDEN ──────────────────────────
  {
    category: 'Wohlbefinden',
    icon: 'W',
    items: [
      { id: 80, text: 'Fühlen Sie sich ängstlich oder besorgt?',         type: 'yesno' },
      { id: 81, text: 'Haben Sie Schlafprobleme?',                       type: 'yesno' },
      { id: 82, text: 'Fühlen Sie sich niedergeschlagen?',               type: 'yesno' },
    ],
  },

  // ── ABSCHLUSS ─────────────────────────────────────────
  {
    category: 'Abschluss',
    icon: 'X',
    items: [
      { id: 100, text: 'Haben Sie noch weitere Beschwerden, die wir nicht besprochen haben?', type: 'yesno' },
      { id: 101, text: 'Haben Sie Fragen an den Arzt?',                  type: 'text' },
      { id: 102, text: 'Haben Sie alles verstanden, was wir besprochen haben?', type: 'yesno' },
    ],
  },
];

export default questions;
