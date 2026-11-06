import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Konfiguration                                                      */
/* ------------------------------------------------------------------ */

const COLORS = { fill: '#eef2f7', outline: '#94a3b8', detail: '#cbd5e1' };
const SIDE = { left: 'links', right: 'rechts' };

const zone = (view, id, label, cx, cy, rx, ry, rot = 0) =>
  ({ id: `${view}-${id}`, view, label, cx, cy, rx, ry, rot });

// Erzeugt eine Zone für beide Körperseiten; x = Position in der linken Bildhälfte.
// Vorderansicht: links im Bild = RECHTE Körperseite (Patient:in schaut uns an).
// Rückansicht:   links im Bild = LINKE Körperseite.
function pair(view, id, label, x, cy, rx, ry, rot = 0) {
  const [near, far] = view === 'front' ? ['right', 'left'] : ['left', 'right'];
  return [
    zone(view, `${id}-${near}`, `${label} ${SIDE[near]}`, x, cy, rx, ry, rot),
    zone(view, `${id}-${far}`, `${label} ${SIDE[far]}`, 100 - x, cy, rx, ry, -rot),
  ];
}

const FRONT = [
  zone('front', 'forehead', 'Stirn', 50, 6, 5.5, 3.3),
  zone('front', 'face', 'Gesicht', 50, 14, 6, 5.5),
  zone('front', 'neck', 'Hals', 50, 22, 3.8, 3),
  zone('front', 'chest', 'Brust', 50, 40, 11, 8),
  zone('front', 'abdomen', 'Bauch', 50, 58, 10, 8.5),
  zone('front', 'navel', 'Bauchnabel', 50, 60, 2, 2),
  zone('front', 'groin', 'Intimbereich', 50, 73, 4.5, 3.5),
  ...pair('front', 'ear', 'Ohr', 42.4, 11.2, 1.6, 2.6),
  ...pair('front', 'shoulder', 'Schulter', 33.8, 32.5, 4, 3.5),
  ...pair('front', 'upper-arm', 'Oberarm', 32.6, 43, 3.8, 7.5, 12.5),
  ...pair('front', 'forearm', 'Unterarm', 27.8, 65, 3.3, 7.5, 10.5),
  ...pair('front', 'fingers', 'Finger', 24.6, 83.3, 2.5, 3.2, 10),
  ...pair('front', 'hip', 'Hüfte', 38.6, 69.5, 3.4, 3.5),
  ...pair('front', 'thigh', 'Oberschenkel', 42, 91, 5.5, 12),
  ...pair('front', 'knee', 'Knie', 40.5, 106, 3.8, 3.5),
  ...pair('front', 'shin', 'Schienbein', 40.5, 121, 3.5, 10),
  ...pair('front', 'foot', 'Fuß', 40, 140.5, 4.2, 3.5),
];

const BACK = [
  zone('back', 'head', 'Kopf', 50, 11, 7, 9.5),
  zone('back', 'neck', 'Nacken', 50, 22, 3.8, 3),
  zone('back', 'back', 'Rücken', 50, 45, 11.5, 15),
  ...pair('back', 'ear', 'Ohr', 42.4, 11.2, 1.6, 2.6),
  ...pair('back', 'upper-arm', 'Oberarm', 32.8, 42, 3.8, 6.5, 12.5),
  ...pair('back', 'elbow', 'Ellenbogen', 29.8, 55, 3.2, 3),
  ...pair('back', 'forearm', 'Unterarm', 27.6, 66, 3.3, 7, 10.5),
  ...pair('back', 'hand', 'Hand', 25, 80, 3, 6, 10),
  ...pair('back', 'glute', 'Gesäß', 43.5, 70, 6.5, 5.5),
  ...pair('back', 'thigh', 'Oberschenkel hinten', 42, 91, 5.5, 12),
  ...pair('back', 'calf', 'Wade', 40.5, 121, 3.8, 10),
  ...pair('back', 'heel', 'Ferse', 40.3, 140.5, 3.8, 3.5),
];

/* ------------------------------------------------------------------ */
/*  Vergrößerte Ansichten (Detail)                                     */
/* ------------------------------------------------------------------ */

// Rücken, von hinten gesehen: links im Bild = linke Körperseite.
const BACK_DETAIL_ZONES = (() => {
  const rows = [['upper', 'Oberer Rücken', 10, 36], ['middle', 'Mittlerer Rücken', 36, 62], ['lower', 'Unterer Rücken', 62, 90]];
  const cols = [['left', 'links', 18, 46], ['right', 'rechts', 54, 82]];
  const z = [];
  rows.forEach(([rk, rl, y1, y2]) => cols.forEach(([ck, cl, x1, x2]) =>
    z.push({ id: `detail-back-${rk}-${ck}`, label: `${rl} ${cl}`, rect: [x1, y1, x2 - x1, y2 - y1] })));
  z.push({ id: 'detail-back-spine', label: 'Wirbelsäule', rect: [46, 6, 8, 88] });
  z.push({ id: 'detail-back-sacrum', label: 'Kreuzbein / Steißbein', rect: [40, 90, 20, 10] });
  return z;
})();

const footDetailZones = side => [
  { id: `detail-foot-${side}-ankle`,   label: `Knöchel ${SIDE[side]}`,   ell: [32, 28, 8, 6] },
  { id: `detail-foot-${side}-heel`,    label: `Ferse ${SIDE[side]}`,     ell: [19, 52, 8, 8] },
  { id: `detail-foot-${side}-instep`,  label: `Fußrücken ${SIDE[side]}`, ell: [64, 43, 18, 6] },
  { id: `detail-foot-${side}-sole`,    label: `Fußsohle ${SIDE[side]}`,  ell: [58, 59, 28, 3.6] },
  { id: `detail-foot-${side}-toes`,    label: `Zehen ${SIDE[side]}`,     ell: [103, 53, 10, 7.5] },
];

const DETAIL_VIEWS = {
  back: {
    title: 'Rücken – vergrößerte Ansicht',
    hint: 'Ansicht von hinten: links im Bild ist Ihre linke Seite.',
    viewBox: '0 0 100 104',
    outline: 'M30 3 C40 1 60 1 70 3 L86 9 C89 30 85 60 83 90 C70 100 30 100 17 90 C15 60 11 30 14 9 Z',
    zones: BACK_DETAIL_ZONES,
  },
  'foot-right': {
    title: 'Rechter Fuß – vergrößerte Ansicht',
    hint: 'Seitenansicht des rechten Fußes: Zehen zeigen nach rechts.',
    viewBox: '0 0 120 68',
    outline: 'M22 3 L41 3 L43 33 C60 37 86 41 105 46 C114 49 116 57 109 62 L20 62 C11 62 9 53 11 45 C13 39 18 35 20 29 Z',
    zones: footDetailZones('right'),
  },
  'foot-left': {
    title: 'Linker Fuß – vergrößerte Ansicht',
    hint: 'Seitenansicht des linken Fußes: Zehen zeigen nach rechts.',
    viewBox: '0 0 120 68',
    outline: 'M22 3 L41 3 L43 33 C60 37 86 41 105 46 C114 49 116 57 109 62 L20 62 C11 62 9 53 11 45 C13 39 18 35 20 29 Z',
    zones: footDetailZones('left'),
  },
};

// Welche Zone im Gesamtbild öffnet welche vergrößerte Ansicht
const DETAIL_FOR = {
  'back-back':       'back',
  'front-foot-right': 'foot-right',
  'front-foot-left':  'foot-left',
  'back-heel-right':  'foot-right',
  'back-heel-left':   'foot-left',
};

const DETAIL_ZONES = Object.entries(DETAIL_VIEWS).flatMap(([key, d]) => d.zones.map(z => ({ ...z, detail: key })));

const BY_ID = Object.fromEntries([...FRONT, ...BACK, ...DETAIL_ZONES].map(p => [p.id, p]));
const FRONT_LABELS = new Set(FRONT.map(p => p.label));

// Anzeigename: gleichnamige Zonen der Rückseite (z. B. "Hals") werden unterscheidbar
const tagText = id => {
  const p = BY_ID[id];
  return p.view === 'back' && FRONT_LABELS.has(p.label) ? `${p.label} (Rückseite)` : p.label;
};

/* ------------------------------------------------------------------ */
/*  Silhouette                                                         */
/* ------------------------------------------------------------------ */

// Linke Bildhälfte einer neutralen Figur; die rechte Hälfte entsteht durch Spiegelung.
const HALF = [
  // Kopf mit Kieferlinie, Ohr
  'M50.5 1.5 C45.8 1.5 43 5.4 43 10.5 C43 13.6 43.6 16.4 45 18.4 C46.4 20.3 48.2 21.3 50.5 21.3 Z',
  'M43.4 9.2 C41.8 8.7 41.3 10.8 41.7 12.6 C42.1 13.9 42.9 14 43.4 13.3 Z',
  // Hals
  'M45.8 17 C46.1 20.5 45.9 23 45.2 25.5 L50.5 26 L50.5 17 Z',
  // Rumpf: Nacken-Schulter-Linie, Brustkorb, Taille, Becken
  'M50.5 24 L45.4 24 C42.3 25.7 38 27.1 35.2 28.4 C32.8 29.4 31.4 31.4 31.4 34.2 C31.4 36.6 33.9 38.8 36.8 40 ' +
    'C37.1 44.2 38.2 48.8 39.1 52.2 C39.8 55.2 39.8 57.8 39.3 60.2 C38.5 63.8 35.9 67.2 35.1 71 ' +
    'C34.8 73 35.2 75 35.8 76 L50.5 76.5 Z',
  // Arm: Schulter, Oberarm, Ellenbogen, Unterarm, Handgelenk
  'M35.8 29.6 C32.4 30 30.5 32 30.5 34.6 C30.2 37.5 29.5 39.8 29.4 41.8 C29 46 28 51 27.4 54.4 ' +
    'C26.6 55.9 26.2 57 26 58.4 C25.1 63.5 24.5 69.5 24.1 74.6 L27.9 75.4 C28.5 70 30.5 64 31.9 59.6 ' +
    'C32.2 58 32.3 56.8 32.2 55.6 C33.4 51.5 35.5 47 36.3 43.4 C36.7 41 37 39 36.8 37 Z',
  // Hand mit Daumen (nach außen, anatomische Normalstellung)
  'M24.4 72.6 L24.1 74.6 C23 75.8 22 77.3 21.4 79.1 C20.9 80.2 21.4 81.2 22.1 80.7 C22.6 80.4 22.9 79.8 23 79.3 ' +
    'C22.6 81.2 22.6 83.2 23 84.8 C23.5 86.2 25.2 86.3 25.9 85.2 C26.9 83.4 27.6 80.4 27.9 75.4 L28.2 73 Z',
  // Bein: Oberschenkel, Knie, Wade, Knöchel
  'M35.5 70 C34.4 76 34.4 82 35 88 C35.6 94 36.7 100 37.2 105 C36.8 109 36.5 113 36.8 118 ' +
    'C37.1 125 38.5 130 38.9 135 L42.1 135 C42.4 130 44 124 44 118 C44.1 113.5 43.6 110 43.8 105.5 ' +
    'C44.5 98 46.3 90 47.6 84 C48.4 80.5 49.3 78 49.9 76 L50.5 72 Z',
  // Fuß
  'M38.9 134.5 C38.2 137.4 36.5 139.6 36.5 141.4 C36.4 143 37.9 143.6 40 143.6 L42.5 143.6 ' +
    'C43.5 143.6 43.9 142.8 43.5 141.6 C43.1 139.5 42.5 137.5 42.2 134.5 Z',
];

// Feine Linien (ebenfalls nur linke Hälfte, wird gespiegelt)
const DETAILS = {
  front: 'M45.6 27.5 C42.4 28.7 39 29 35.8 29.9 M39.1 106 C40.2 107.2 41.8 107.2 43 106 ' +
    'M24.2 82.2 L24.4 85.2 M25.3 82 L25.5 84.9',
  back: 'M40.8 32 C38.2 35 38.2 41.5 40.6 44.5 M49.6 76 C46.8 77.7 41.8 77.9 37.9 76.4 ' +
    'M39.1 107.5 C40.2 108.5 41.8 108.5 43 107.5',
};

const MIRROR = 'matrix(-1 0 0 1 100 0)';
const bothSides = content => [undefined, MIRROR].map(t => <g key={t || 'l'} transform={t}>{content}</g>);

// Zweimal zeichnen (Umriss etwas größer, darüber die Füllung) → eine nahtlose Silhouette
const shapes = (color, outline) => (
  <g fill={color} stroke={color} strokeWidth={outline} strokeLinejoin="round">
    {bothSides(HALF.map((d, i) => <path key={i} d={d} />))}
  </g>
);

const Silhouette = ({ back }) => (
  <g aria-hidden="true">
    {shapes(COLORS.outline, 1.4)}
    {shapes(COLORS.fill, 0)}
    <g fill="none" stroke={COLORS.detail} strokeWidth="0.6" strokeLinecap="round">
      {bothSides(<path d={back ? DETAILS.back : DETAILS.front} />)}
      {back
        ? <path d="M50 29 V66 M50 68.5 V76" strokeDasharray="1.2 1.4" />
        : <circle cx="50" cy="60" r="0.7" />}
    </g>
  </g>
);

/* ------------------------------------------------------------------ */
/*  Komponenten                                                        */
/* ------------------------------------------------------------------ */

const ZONE_CSS = `
  .bm-zone { fill: transparent; cursor: pointer; transition: fill .15s; outline: none; }
  @media (hover: hover) { .bm-zone:hover { fill: rgba(37, 99, 235, .18); } }
  .bm-zone:focus-visible { stroke: #2563eb; stroke-width: .8; }
  .bm-zone.is-selected { fill: rgba(220, 38, 38, .5); stroke: #dc2626; stroke-width: .6; }
`;

function BodyView({ title, parts, selected, onToggle, back }) {
  return (
    <figure className="body-model-view" style={{ margin: 0, textAlign: 'center' }}>
      <figcaption className="body-view-label">{title}</figcaption>
      <svg
        viewBox="0 0 100 148"
        className="body-svg"
        style={{ width: 'min(42vw, 260px)', height: 'auto', display: 'block', touchAction: 'manipulation' }}
      >
        <Silhouette back={back} />
        {parts.map(p => {
          const on = selected.includes(p.id);
          return (
            <ellipse
              key={p.id}
              className={`bm-zone${on ? ' is-selected' : ''}`}
              cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry}
              transform={p.rot ? `rotate(${p.rot} ${p.cx} ${p.cy})` : undefined}
              role="button" tabIndex={0} aria-label={p.label} aria-pressed={on}
              onClick={() => onToggle(p.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(p.id); }
              }}
            >
              <title>{p.label}</title>
            </ellipse>
          );
        })}
      </svg>
    </figure>
  );
}

function DetailView({ detailKey, selected, onToggle, onClose }) {
  const d = DETAIL_VIEWS[detailKey];
  return (
    <div className="body-detail-card">
      <div className="body-detail-head">
        <div>
          <div className="body-detail-title">{d.title}</div>
          <div className="body-detail-hint">{d.hint}</div>
        </div>
        <button type="button" className="body-detail-close" onClick={onClose}>Fertig</button>
      </div>
      <svg viewBox={d.viewBox} className="body-detail-svg" style={{ touchAction: 'manipulation' }}>
        <path d={d.outline} fill={COLORS.fill} stroke={COLORS.outline} strokeWidth="1.2" strokeLinejoin="round" />
        {d.zones.map(z => {
          const on = selected.includes(z.id);
          const common = {
            key: z.id,
            className: `bm-zone bm-detail-zone${on ? ' is-selected' : ''}`,
            role: 'button', tabIndex: 0, 'aria-label': z.label, 'aria-pressed': on,
            onClick: () => onToggle(z.id),
            onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(z.id); } },
          };
          return z.rect
            ? <rect {...common} x={z.rect[0]} y={z.rect[1]} width={z.rect[2]} height={z.rect[3]} rx="3"><title>{z.label}</title></rect>
            : <ellipse {...common} cx={z.ell[0]} cy={z.ell[1]} rx={z.ell[2]} ry={z.ell[3]}><title>{z.label}</title></ellipse>;
        })}
      </svg>
      <div className="body-detail-legend">
        {d.zones.map(z => (
          <button
            key={z.id} type="button"
            className={`body-detail-chip${selected.includes(z.id) ? ' on' : ''}`}
            onClick={() => onToggle(z.id)}
          >
            {z.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Teile, die tatsächlich gemeldet werden: Wurde in der vergrößerten Ansicht etwas
// gewählt, ersetzt das die grobe Zone (z. B. "Unterer Rücken rechts" statt "Rücken").
function reportedIds(selected) {
  return selected.filter(id => {
    const detailKey = DETAIL_FOR[id];
    if (!detailKey) return true;
    return !selected.some(s => BY_ID[s].detail === detailKey);
  });
}

function parentFor(detailKey, selected) {
  return Object.keys(DETAIL_FOR).find(pid => DETAIL_FOR[pid] === detailKey && selected.includes(pid))
    || Object.keys(DETAIL_FOR).find(pid => DETAIL_FOR[pid] === detailKey);
}

export default function BodyModel({ onSelect, hint }) {
  const [selected, setSelected] = useState([]);
  const [openDetail, setOpenDetail] = useState(null);

  function update(next) {
    setSelected(next);
    onSelect?.(reportedIds(next).map(x => BY_ID[x].label));
  }

  // Zone im Gesamtbild
  function toggleMain(id) {
    const detailKey = DETAIL_FOR[id];
    if (detailKey) {
      // Zonen mit vergrößerter Ansicht: auswählen und Detailansicht öffnen
      if (!selected.includes(id)) update([...selected, id]);
      setOpenDetail(detailKey);
      return;
    }
    update(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  // Zone in der vergrößerten Ansicht
  function toggleDetail(id) {
    const detailKey = BY_ID[id].detail;
    let next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
    const parent = parentFor(detailKey, next);
    if (next.includes(id) && parent && !next.includes(parent)) next = [...next, parent];
    update(next);
  }

  // Entfernen über die Markierungs-Chips
  function remove(id) {
    const detailKey = DETAIL_FOR[id];
    let next = selected.filter(x => x !== id);
    if (detailKey) next = next.filter(x => BY_ID[x].detail !== detailKey);
    if (BY_ID[id].detail) {
      const rest = next.filter(x => BY_ID[x].detail === BY_ID[id].detail);
      if (rest.length === 0) {
        const parents = Object.keys(DETAIL_FOR).filter(pid => DETAIL_FOR[pid] === BY_ID[id].detail);
        next = next.filter(x => !parents.includes(x));
      }
    }
    update(next);
  }

  const shown = reportedIds(selected);

  return (
    <div className="body-model-area">
      <style>{ZONE_CSS}</style>
      <p className="body-model-label">
        {hint || 'Bitte tippen Sie auf die betroffenen Stellen.'}
        <br />
        <span className="body-model-sublabel">Beim Rücken und bei den Füßen öffnet sich eine vergrößerte Ansicht.</span>
      </p>

      <div
        className="body-model-views"
        style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px, 5vw, 48px)' }}
      >
        <BodyView title="Vorderseite" parts={FRONT} selected={selected} onToggle={toggleMain} />
        <BodyView title="Rückseite" parts={BACK} selected={selected} onToggle={toggleMain} back />
      </div>

      {openDetail && (
        <DetailView
          detailKey={openDetail}
          selected={selected}
          onToggle={toggleDetail}
          onClose={() => setOpenDetail(null)}
        />
      )}

      {shown.length > 0 && (
        <div className="body-selected-parts">
          {shown.map(id => (
            <div key={id} className="body-part-tag">
              {tagText(id)}
              <button type="button" aria-label={`${tagText(id)} entfernen`} onClick={() => remove(id)}>
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
