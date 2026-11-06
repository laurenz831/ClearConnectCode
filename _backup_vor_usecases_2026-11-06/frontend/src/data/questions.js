// Fragebibliothek für das Arzt-Dashboard.
//
// Typen:
//   'yesno'    → Patient sieht Ja / Nein Buttons + "Ich weiß nicht"
//   'scale'    → Patient sieht VAS-Skala 0–10
//   'text'     → Patient sieht nur ein Textfeld
//   'body'     → Patient sieht Körpermodell (Schmerzort)
//   'calendar' → Patient sieht Kalender (Datum wählen)

const questions = [
  // ── SCHMERZORT ────────────────────────────────────────
  {
    category: 'Schmerzort',
    icon: 'O',
    items: [
      { id: 1,  text: 'Wo genau haben Sie Schmerzen?',                        type: 'body'   },
      { id: 2,  text: 'Haben Sie Schmerzen in der Brust?',                    type: 'yesno'  },
      { id: 3,  text: 'Haben Sie Schmerzen im Bauch?',                        type: 'yesno'  },
      { id: 4,  text: 'Haben Sie Schmerzen im Kopf?',                         type: 'yesno'  },
      { id: 5,  text: 'Haben Sie Rückenschmerzen?',                           type: 'yesno'  },
      { id: 6,  text: 'Strahlen die Schmerzen in andere Stellen aus?',        type: 'yesno'  },
      { id: 7,  text: 'Bitte zeigen Sie mir, wo die Schmerzen am stärksten sind.', type: 'body' },
    ],
  },

  // ── SCHMERZINTENSITÄT ─────────────────────────────────
  {
    category: 'Schmerzintensität',
    icon: 'S',
    items: [
      { id: 10, text: 'Wie stark sind Ihre Schmerzen gerade? (0 = kein Schmerz, 10 = stärkster Schmerz)', type: 'scale'  },
      { id: 11, text: 'Sind die Schmerzen heute stärker als gestern?',        type: 'yesno'  },
      { id: 12, text: 'Fällt es Ihnen wegen der Schmerzen schwer zu schlafen?', type: 'yesno' },
      { id: 13, text: 'Sind die Schmerzen stechend oder brennend?',           type: 'yesno'  },
      { id: 14, text: 'Sind die Schmerzen dumpf oder drückend?',              type: 'yesno'  },
      { id: 15, text: 'Kommen die Schmerzen in Wellen?',                      type: 'yesno'  },
      { id: 16, text: 'Haben die Schmerzen Sie heute Nacht aufgeweckt?',      type: 'yesno'  },
    ],
  },

  // ── SCHMERZDAUER ──────────────────────────────────────
  {
    category: 'Schmerzdauer',
    icon: 'Z',
    items: [
      { id: 20, text: 'Seit wann haben Sie diese Schmerzen?',                 type: 'calendar' },
      { id: 21, text: 'Haben die Schmerzen heute begonnen?',                  type: 'yesno'    },
      { id: 22, text: 'Hatten Sie diese Schmerzen schon früher?',             type: 'yesno'    },
      { id: 23, text: 'Sind die Schmerzen dauerhaft oder kommen und gehen sie?', type: 'yesno' },
    ],
  },

  // ── ALLGEMEINZUSTAND ──────────────────────────────────
  {
    category: 'Allgemeinzustand',
    icon: 'A',
    items: [
      { id: 30, text: 'Fühlen Sie sich müde oder erschöpft?',                 type: 'yesno'  },
      { id: 31, text: 'Haben Sie Fieber?',                                    type: 'yesno'  },
      { id: 32, text: 'Haben Sie Husten?',                                    type: 'yesno'  },
      { id: 33, text: 'Haben Sie Atemnot?',                                   type: 'yesno'  },
      { id: 34, text: 'Haben Sie Schwindel?',                                 type: 'yesno'  },
      { id: 35, text: 'Übelkeit oder Erbrechen?',                             type: 'yesno'  },
      { id: 36, text: 'Haben Sie Appetit?',                                   type: 'yesno'  },
      { id: 37, text: 'Haben Sie in letzter Zeit an Gewicht verloren?',       type: 'yesno'  },
      { id: 38, text: 'Können Sie sich normal bewegen?',                      type: 'yesno'  },
      { id: 39, text: 'Haben Sie ein Kribbeln oder Taubheitsgefühl?',         type: 'yesno'  },
    ],
  },

  // ── VERDAUUNG / AUSSCHEIDUNG ──────────────────────────
  {
    category: 'Verdauung',
    icon: 'V',
    items: [
      { id: 40, text: 'Haben Sie Probleme beim Wasserlassen?',                type: 'yesno' },
      { id: 41, text: 'Haben Sie Durchfall oder Verstopfung?',                type: 'yesno' },
      { id: 42, text: 'Haben Sie Blut im Stuhl bemerkt?',                     type: 'yesno' },
      { id: 43, text: 'Haben Sie Magenschmerzen nach dem Essen?',             type: 'yesno' },
    ],
  },

  // ── HERZ / KREISLAUF ──────────────────────────────────
  {
    category: 'Herz & Kreislauf',
    icon: 'H',
    items: [
      { id: 50, text: 'Haben Sie Herzrasen oder unregelmäßigen Herzschlag?',  type: 'yesno' },
      { id: 51, text: 'Haben Sie Schmerzen in der Brust bei Belastung?',      type: 'yesno' },
      { id: 52, text: 'Schwellen Ihre Beine an?',                             type: 'yesno' },
      { id: 53, text: 'Haben Sie Kurzatmigkeit beim Treppensteigen?',         type: 'yesno' },
    ],
  },

  // ── MEDIKAMENTE ───────────────────────────────────────
  {
    category: 'Medikamente',
    icon: 'M',
    items: [
      { id: 60, text: 'Nehmen Sie regelmäßig Medikamente?',                   type: 'yesno' },
      { id: 61, text: 'Haben Sie Ihre Medikamente heute genommen?',           type: 'yesno' },
      { id: 62, text: 'Haben Sie Nebenwirkungen bei Ihren Medikamenten?',     type: 'yesno' },
      { id: 63, text: 'Haben Sie Schmerzmittel eingenommen?',                 type: 'yesno' },
      { id: 64, text: 'Wann haben Sie zuletzt Schmerzmittel genommen?',       type: 'calendar' },
      { id: 65, text: 'Sind die Schmerzmittel wirksam?',                      type: 'yesno' },
    ],
  },

  // ── VORGESCHICHTE ─────────────────────────────────────
  {
    category: 'Vorgeschichte',
    icon: 'G',
    items: [
      { id: 70, text: 'Waren Sie in letzter Zeit im Krankenhaus?',            type: 'yesno' },
      { id: 71, text: 'Wann waren Sie zuletzt beim Arzt?',                    type: 'calendar' },
      { id: 72, text: 'Haben Sie bekannte Erkrankungen?',                     type: 'yesno' },
      { id: 73, text: 'Wurden Sie jemals operiert?',                          type: 'yesno' },
      { id: 74, text: 'Haben Sie Allergien?',                                 type: 'yesno' },
    ],
  },

  // ── PSYCHISCHES WOHLBEFINDEN ──────────────────────────
  {
    category: 'Wohlbefinden',
    icon: 'W',
    items: [
      { id: 80, text: 'Fühlen Sie sich ängstlich oder besorgt?',              type: 'yesno' },
      { id: 81, text: 'Haben Sie Schlafprobleme?',                            type: 'yesno' },
      { id: 82, text: 'Fühlen Sie sich niedergeschlagen?',                    type: 'yesno' },
      { id: 83, text: 'Wie gut fühlen Sie sich insgesamt? (0 = sehr schlecht, 10 = sehr gut)', type: 'scale' },
    ],
  },

  // ── VORSORGE / CHECK-UP ───────────────────────────────
  {
    category: 'Vorsorge',
    icon: 'P',
    items: [
      { id: 90, text: 'Wann war Ihre letzte Blutuntersuchung?',               type: 'calendar' },
      { id: 91, text: 'Haben Sie Ihren Blutdruck in letzter Zeit gemessen?',  type: 'yesno'    },
      { id: 92, text: 'Rauchen Sie?',                                         type: 'yesno'    },
      { id: 93, text: 'Trinken Sie regelmäßig Alkohol?',                      type: 'yesno'    },
      { id: 94, text: 'Treiben Sie Sport?',                                   type: 'yesno'    },
      { id: 95, text: 'Haben Sie Stress im Alltag?',                          type: 'yesno'    },
    ],
  },

  // ── ABSCHLUSS ─────────────────────────────────────────
  {
    category: 'Abschluss',
    icon: 'X',
    items: [
      { id: 100, text: 'Haben Sie noch weitere Beschwerden, die wir nicht besprochen haben?', type: 'yesno' },
      { id: 101, text: 'Haben Sie Fragen an den Arzt?',                        type: 'yesno'  },
      { id: 102, text: 'Haben Sie alles verstanden, was wir besprochen haben?', type: 'yesno' },
    ],
  },
];

export default questions;
