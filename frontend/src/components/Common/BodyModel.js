import React, { useState } from 'react';

// Körperzonen – jeweils mit einem SVG-Pfad und einem lesbaren Namen
const FRONT_PARTS = [
  { id: 'forehead',         label: 'Stirn',                  cx: 50, cy: 8,   rx: 8,  ry: 5 },
  { id: 'face',             label: 'Gesicht',                cx: 50, cy: 14,  rx: 9,  ry: 8 },
  { id: 'neck-front',       label: 'Hals',                   cx: 50, cy: 26,  rx: 4,  ry: 6 },
  { id: 'shoulder-left',    label: 'Schulter links',         cx: 32, cy: 33,  rx: 7,  ry: 6 },
  { id: 'shoulder-right',   label: 'Schulter rechts',        cx: 68, cy: 33,  rx: 7,  ry: 6 },
  { id: 'chest',            label: 'Brust',                  cx: 50, cy: 43,  rx: 10, ry: 10 },
  { id: 'abdomen',          label: 'Bauch',                  cx: 50, cy: 60,  rx: 11, ry: 12 },
  { id: 'upper-arm-left',   label: 'Oberarm links',          cx: 25, cy: 42,  rx: 6,  ry: 10 },
  { id: 'upper-arm-right',  label: 'Oberarm rechts',         cx: 75, cy: 42,  rx: 6,  ry: 10 },
  { id: 'forearm-left',     label: 'Unterarm links',         cx: 18, cy: 58,  rx: 5,  ry: 12 },
  { id: 'forearm-right',    label: 'Unterarm rechts',        cx: 82, cy: 58,  rx: 5,  ry: 12 },
  { id: 'palm-left',        label: 'Handinnenfläche links',  cx: 14, cy: 72,  rx: 5,  ry: 6 },
  { id: 'palm-right',       label: 'Handinnenfläche rechts', cx: 86, cy: 72,  rx: 5,  ry: 6 },
  { id: 'hip-left',         label: 'Hüfte links',            cx: 38, cy: 75,  rx: 7,  ry: 6 },
  { id: 'hip-right',        label: 'Hüfte rechts',           cx: 62, cy: 75,  rx: 7,  ry: 6 },
  { id: 'groin',            label: 'Intimbereich',           cx: 50, cy: 80,  rx: 6,  ry: 5 },
  { id: 'thigh-left',       label: 'Oberschenkel links',     cx: 40, cy: 97,  rx: 7,  ry: 14 },
  { id: 'thigh-right',      label: 'Oberschenkel rechts',    cx: 60, cy: 97,  rx: 7,  ry: 14 },
  { id: 'knee-left',        label: 'Knie links',             cx: 40, cy: 112, rx: 6,  ry: 5 },
  { id: 'knee-right',       label: 'Knie rechts',            cx: 60, cy: 112, rx: 6,  ry: 5 },
  { id: 'shin-left',        label: 'Schienbein links',       cx: 40, cy: 127, rx: 5,  ry: 12 },
  { id: 'shin-right',       label: 'Schienbein rechts',      cx: 60, cy: 127, rx: 5,  ry: 12 },
  { id: 'foot-left',        label: 'Fuß links',              cx: 40, cy: 142, rx: 6,  ry: 4 },
  { id: 'foot-right',       label: 'Fuß rechts',             cx: 60, cy: 142, rx: 6,  ry: 4 },
];

const BACK_PARTS = [
  { id: 'head-back',           label: 'Kopf',                       cx: 50, cy: 12,  rx: 10, ry: 9 },
  { id: 'neck-back',           label: 'Hals',                       cx: 50, cy: 26,  rx: 4,  ry: 6 },
  { id: 'back',                label: 'Rücken',                     cx: 50, cy: 52,  rx: 11, ry: 16 },
  { id: 'upper-arm-left-back', label: 'Oberarm links',              cx: 25, cy: 42,  rx: 6,  ry: 10 },
  { id: 'upper-arm-right-back',label: 'Oberarm rechts',             cx: 75, cy: 42,  rx: 6,  ry: 10 },
  { id: 'elbow-left',          label: 'Ellenbogen links',           cx: 20, cy: 54,  rx: 5,  ry: 4 },
  { id: 'elbow-right',         label: 'Ellenbogen rechts',          cx: 80, cy: 54,  rx: 5,  ry: 4 },
  { id: 'forearm-left-back',   label: 'Unterarm links',             cx: 18, cy: 65,  rx: 5,  ry: 12 },
  { id: 'forearm-right-back',  label: 'Unterarm rechts',            cx: 82, cy: 65,  rx: 5,  ry: 12 },
  { id: 'palm-back-left',      label: 'Handaußenfläche links',      cx: 14, cy: 78,  rx: 5,  ry: 6 },
  { id: 'palm-back-right',     label: 'Handaußenfläche rechts',     cx: 86, cy: 78,  rx: 5,  ry: 6 },
  { id: 'glute-left',          label: 'Gesäß links',                cx: 40, cy: 73,  rx: 8,  ry: 8 },
  { id: 'glute-right',         label: 'Gesäß rechts',               cx: 60, cy: 73,  rx: 8,  ry: 8 },
  { id: 'thigh-back-left',     label: 'Oberschenkel hinten links',  cx: 40, cy: 97,  rx: 7,  ry: 14 },
  { id: 'thigh-back-right',    label: 'Oberschenkel hinten rechts', cx: 60, cy: 97,  rx: 7,  ry: 14 },
  { id: 'calf-left',           label: 'Wade links',                 cx: 40, cy: 125, rx: 5,  ry: 13 },
  { id: 'calf-right',          label: 'Wade rechts',                cx: 60, cy: 125, rx: 5,  ry: 13 },
  { id: 'heel-left',           label: 'Ferse links',                cx: 38, cy: 141, rx: 5,  ry: 4 },
  { id: 'heel-right',          label: 'Ferse rechts',               cx: 62, cy: 141, rx: 5,  ry: 4 },
];

function BodySVG({ parts, selected, onToggle, label }) {
  return (
    <div className="body-model-view">
      <span className="body-view-label">{label}</span>
      <svg
        viewBox="0 0 100 160"
        className="body-svg"
        style={{ width: 75, height: 140 }}
      >
        {/* KOPF - realistisch oval */}
        <ellipse cx="50" cy="11" rx="10" ry="11" fill="none" stroke="#333" strokeWidth="1" />
        
        {/* OHREN - subtil */}
        <path d="M 38 10 Q 35 12 36 15" stroke="#333" strokeWidth="0.7" fill="none" />
        <path d="M 62 10 Q 65 12 64 15" stroke="#333" strokeWidth="0.7" fill="none" />
        
        {/* GESICHT - Details */}
        <line x1="46" y1="9" x2="46" y2="12" stroke="#333" strokeWidth="0.5" />
        <line x1="54" y1="9" x2="54" y2="12" stroke="#333" strokeWidth="0.5" />
        <path d="M 46 14 Q 50 15.5 54 14" stroke="#333" strokeWidth="0.5" fill="none" />

        {/* HALS - konvex */}
        <path d="M 46 22 Q 45 25 46 28" stroke="#333" strokeWidth="0.9" fill="none" />
        <path d="M 54 22 Q 55 25 54 28" stroke="#333" strokeWidth="0.9" fill="none" />

        {/* OBERKÖRPER - realistische Brustkorb-Form */}
        <path d="M 46 28 L 32 37 Q 30 43 30 50 Q 30 58 33 65 Q 35 68 42 70 L 58 70 Q 65 68 67 65 Q 70 58 70 50 Q 70 43 68 37 L 54 28" 
              stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* SCHULTERN - breiter */}
        <path d="M 32 37 Q 30 38 28 40" stroke="#333" strokeWidth="0.8" fill="none" />
        <path d="M 68 37 Q 70 38 72 40" stroke="#333" strokeWidth="0.8" fill="none" />

        {/* BRUSTMITTE - Linie */}
        <line x1="50" y1="28" x2="50" y2="68" stroke="#ddd" strokeWidth="0.5" opacity="0.5" />
        
        {/* BRUSTWARZEN-HINWEISE */}
        <circle cx="45" cy="48" r="0.8" fill="none" stroke="#ddd" strokeWidth="0.4" opacity="0.4" />
        <circle cx="55" cy="48" r="0.8" fill="none" stroke="#ddd" strokeWidth="0.4" opacity="0.4" />

        {/* OBERARME - gekrümmt */}
        <path d="M 32 40 Q 25 42 22 50" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 68 40 Q 75 42 78 50" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* UNTERARME - weiter gekrümmt */}
        <path d="M 22 50 Q 18 58 16 72" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 78 50 Q 82 58 84 72" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* HÄNDE - etwas realistischer */}
        <path d="M 15 72 Q 13 73 15 76 Q 17 75 16 72" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M 85 72 Q 87 73 85 76 Q 83 75 84 72" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* TAILLE - Einbuchtung */}
        <path d="M 36 60 Q 34 63 36 68" stroke="#ddd" strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M 64 60 Q 66 63 64 68" stroke="#ddd" strokeWidth="0.6" fill="none" opacity="0.5" />

        {/* BAUCH - natürliche Wölbung */}
        <path d="M 38 62 Q 36 68 38 72 L 62 72 Q 64 68 62 62" 
              stroke="#333" strokeWidth="0.8" fill="none" opacity="0.6" />

        {/* BECKEN / HÜFTEN - breiter Übergang */}
        <path d="M 30 70 Q 28 72 30 78 L 50 80 L 70 78 Q 72 72 70 70" 
              stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* OBERSCHENKEL - dicker, natürliche gekrümmte Linien */}
        <path d="M 34 78 Q 32 88 34 105" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 46 79 Q 47 88 46 105" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        
        <path d="M 54 79 Q 53 88 54 105" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 66 78 Q 68 88 66 105" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* KNIE - Verdünnung */}
        <circle cx="34" cy="105" r="2.2" fill="none" stroke="#ddd" strokeWidth="0.7" opacity="0.6" />
        <circle cx="46" cy="105" r="2.2" fill="none" stroke="#ddd" strokeWidth="0.7" opacity="0.6" />
        <circle cx="54" cy="105" r="2.2" fill="none" stroke="#ddd" strokeWidth="0.7" opacity="0.6" />
        <circle cx="66" cy="105" r="2.2" fill="none" stroke="#ddd" strokeWidth="0.7" opacity="0.6" />

        {/* SCHIENBEIN - dünner als Oberschenkel */}
        <path d="M 37 107 Q 36 118 37 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M 43 107 Q 44 118 43 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        
        <path d="M 57 107 Q 56 118 57 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M 63 107 Q 64 118 63 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* FÜSSE - nur zwei (links und rechts) */}
        <path d="M 40 135 L 37 142 Q 40 144 43 142 Z" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 60 135 L 57 142 Q 60 144 63 142 Z" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Klickbare Zonen */}
        {parts.map(part => {
          const isSelected = selected.includes(part.id);
          return (
            <ellipse
              key={part.id}
              cx={part.cx}
              cy={part.cy}
              rx={part.rx}
              ry={part.ry}
              fill={isSelected ? 'rgba(220,38,38,0.6)' : 'rgba(37,99,235,0.0)'}
              stroke={isSelected ? '#dc2626' : 'transparent'}
              strokeWidth={isSelected ? 1.2 : 0}
              onClick={() => onToggle(part.id, part.label)}
              style={{ cursor: 'pointer' }}
            >
              <title>{part.label}</title>
            </ellipse>
          );
        })}

        {/* Hover-Overlay */}
        {parts.map(part => (
          <ellipse
            key={`hover-${part.id}`}
            cx={part.cx}
            cy={part.cy}
            rx={part.rx}
            ry={part.ry}
            fill="transparent"
            stroke="transparent"
            onClick={() => onToggle(part.id, part.label)}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => { if (!selected.includes(part.id)) e.target.setAttribute('fill', 'rgba(37,99,235,0.15)'); }}
            onMouseLeave={e => { if (!selected.includes(part.id)) e.target.setAttribute('fill', 'transparent'); }}
          />
        ))}
      </svg>
    </div>
  );
}

function BackBodySVG({ parts, selected, onToggle, label }) {
  return (
    <div className="body-model-view">
      <span className="body-view-label">{label}</span>
      <svg
        viewBox="0 0 100 160"
        className="body-svg"
        style={{ width: 75, height: 140 }}
      >
        {/* KOPF - realistisch oval */}
        <ellipse cx="50" cy="11" rx="10" ry="11" fill="none" stroke="#333" strokeWidth="1" />
        
        {/* HINTERKOPF - Haar-Details */}
        <path d="M 48 3 Q 50 1.5 52 3" stroke="#333" strokeWidth="0.7" fill="none" />
        <path d="M 46 5 Q 50 4 54 5" stroke="#333" strokeWidth="0.6" fill="none" />

        {/* HALS - konvex */}
        <path d="M 46 22 Q 45 25 46 28" stroke="#333" strokeWidth="0.9" fill="none" />
        <path d="M 54 22 Q 55 25 54 28" stroke="#333" strokeWidth="0.9" fill="none" />

        {/* RÜCKEN - realistische Muskelkontur */}
        <path d="M 46 28 L 32 37 Q 30 43 30 55 Q 30 65 33 70 Q 35 72 42 73 L 58 73 Q 65 72 67 70 Q 70 65 70 55 Q 70 43 68 37 L 54 28" 
              stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* WIRBELSÄULE - zentrale Linie */}
        <line x1="50" y1="28" x2="50" y2="72" stroke="#ddd" strokeWidth="0.6" opacity="0.6" />
        
        {/* RÜCKENMUSKULATUR - subtile Linien */}
        <path d="M 45 40 Q 43 45 44 55" stroke="#ddd" strokeWidth="0.5" fill="none" opacity="0.5" />
        <path d="M 55 40 Q 57 45 56 55" stroke="#ddd" strokeWidth="0.5" fill="none" opacity="0.5" />

        {/* SCHULTERN - breiter Rücken */}
        <path d="M 32 37 Q 30 38 28 40" stroke="#333" strokeWidth="0.8" fill="none" />
        <path d="M 68 37 Q 70 38 72 40" stroke="#333" strokeWidth="0.8" fill="none" />

        {/* OBERARME - gekrümmt */}
        <path d="M 32 40 Q 25 42 22 50" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 68 40 Q 75 42 78 50" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* UNTERARME - weiter gekrümmt */}
        <path d="M 22 50 Q 18 58 16 72" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 78 50 Q 82 58 84 72" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* HÄNDE - Hand-Rücken */}
        <path d="M 15 72 Q 13 73 15 76 Q 17 75 16 72" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M 85 72 Q 87 73 85 76 Q 83 75 84 72" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* GESÄSS - natürliche Wölbung */}
        <path d="M 36 72 Q 32 77 32 85 L 50 88 L 68 85 Q 68 77 64 72" 
              stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        
        {/* GESÄSSPALT - subtil */}
        <line x1="50" y1="72" x2="50" y2="85" stroke="#ddd" strokeWidth="0.5" opacity="0.4" />

        {/* OBERSCHENKEL HINTEN - dicker, natürliche gekrümmte Linien */}
        <path d="M 34 88 Q 32 95 34 108" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 46 89 Q 47 95 46 108" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        
        <path d="M 54 89 Q 53 95 54 108" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 66 88 Q 68 95 66 108" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* WADE - dünner als Oberschenkel, Muskelansätze */}
        <path d="M 37 108 Q 36 118 37 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M 43 108 Q 44 118 43 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        
        <path d="M 57 108 Q 56 118 57 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M 63 108 Q 64 118 63 135" stroke="#333" strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* FERSEN - nur zwei (links und rechts) */}
        <path d="M 40 135 L 37 142 Q 40 144 43 142 Z" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 60 135 L 57 142 Q 60 144 63 142 Z" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Klickbare Zonen */}
        {parts.map(part => {
          const isSelected = selected.includes(part.id);
          return (
            <ellipse
              key={part.id}
              cx={part.cx}
              cy={part.cy}
              rx={part.rx}
              ry={part.ry}
              fill={isSelected ? 'rgba(220,38,38,0.6)' : 'rgba(37,99,235,0.0)'}
              stroke={isSelected ? '#dc2626' : 'transparent'}
              strokeWidth={isSelected ? 1.2 : 0}
              onClick={() => onToggle(part.id, part.label)}
              style={{ cursor: 'pointer' }}
            >
              <title>{part.label}</title>
            </ellipse>
          );
        })}

        {/* Hover-Overlay */}
        {parts.map(part => (
          <ellipse
            key={`hover-${part.id}`}
            cx={part.cx}
            cy={part.cy}
            rx={part.rx}
            ry={part.ry}
            fill="transparent"
            stroke="transparent"
            onClick={() => onToggle(part.id, part.label)}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => { if (!selected.includes(part.id)) e.target.setAttribute('fill', 'rgba(37,99,235,0.15)'); }}
            onMouseLeave={e => { if (!selected.includes(part.id)) e.target.setAttribute('fill', 'transparent'); }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function BodyModel({ onSelect }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);

  function toggle(id, label) {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      const newLabels = next.map(nid => {
        const all = [...FRONT_PARTS, ...BACK_PARTS];
        return all.find(p => p.id === nid)?.label;
      }).filter(Boolean);
      setSelectedLabels(newLabels);
      if (onSelect) onSelect(newLabels);
      return next;
    });
  }

  function remove(label) {
    const part = [...FRONT_PARTS, ...BACK_PARTS].find(p => p.label === label);
    if (part) toggle(part.id, part.label);
  }

  return (
    <div className="body-model-area">
      <p className="body-model-label">Bitte tippen Sie auf die Stelle, wo Sie Schmerzen haben</p>
      <div className="body-model-views">
        <BodySVG parts={FRONT_PARTS} selected={selectedIds} onToggle={toggle} label="Vorderseite" />
        <BackBodySVG parts={BACK_PARTS}  selected={selectedIds} onToggle={toggle} label="Rückseite" />
      </div>
      {selectedLabels.length > 0 && (
        <div className="body-selected-parts">
          {selectedLabels.map(l => (
            <div key={l} className="body-part-tag">
              {l}
              <button onClick={() => remove(l)}>&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
