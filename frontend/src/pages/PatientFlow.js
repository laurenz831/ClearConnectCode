import React, { useState, useRef, useCallback, useEffect } from 'react';
import { post } from '../services/api';
import BodyModel from '../components/Common/BodyModel';
import logo from '../assets/images/Logo.png';
import erklaervideo from '../assets/videos/erklaervideo.mp4';

const KATEGORIE_TEXT = {
  pain:       'Schmerzen',
  checkup:    'Vorsorge / Check-up',
  medication: 'Medikamente',
  other:      'Sonstiges',
};

const KATEGORIE_ICONS = {
  pain:       '+',
  checkup:    'V',
  medication: 'M',
  other:      '?',
};

function tabletStatus(phase) {
  if (phase === 'welcome' || phase === 'waiting') return { dot: 'waiting',   label: 'Wartend' };
  if (phase === 'called')                         return { dot: 'waiting',   label: 'Aufgerufen' };
  if (phase === 'done')                           return { dot: 'idle',      label: 'Beendet' };
  return                                                 { dot: 'connected', label: 'Verbunden' };
}

// ── Kalender-Komponente ──────────────────────────────────────────────────────
function PatientCalendar({ onSelect }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const monthNames = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const dayNames   = ['Mo','Di','Mi','Do','Fr','Sa','So'];

  const firstDay = new Date(year, month, 1).getDay();
  const offset   = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = d => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }

  function select(d) {
    if (!d) return;
    setSelected(d);
    const label = `${String(d).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`;
    if (onSelect) onSelect(label);
  }

  return (
    <div className="patient-calendar">
      <div className="patient-cal-header">
        <button className="patient-cal-nav" onClick={prevMonth}>‹</button>
        <span className="patient-cal-title">{monthNames[month]} {year}</span>
        <button className="patient-cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="patient-cal-grid">
        {dayNames.map(d => <div key={d} className="patient-cal-day-label">{d}</div>)}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`patient-cal-day ${d === null ? 'empty' : ''} ${d && isToday(d) ? 'today' : ''} ${d === selected ? 'selected' : ''}`}
            onClick={() => select(d)}
          >
            {d || ''}
          </div>
        ))}
      </div>
      {selected && (
        <div className="selected-date-display">
          Gewählt: {String(selected).padStart(2,'0')}.{String(month+1).padStart(2,'0')}.{year}
        </div>
      )}
    </div>
  );
}

// ── VAS-Skala ────────────────────────────────────────────────────────────────
function VASScale({ onSelect }) {
  const [value, setValue] = useState(null);
  const trackRef = useRef(null);

  const updateFromEvent = useCallback(e => {
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.round(pct * 10);
    setValue(v);
    if (onSelect) onSelect(v);
  }, [onSelect]);

  const PAIN_LABELS = ['Kein Schmerz','Sehr leicht','Leicht','Leicht–Mittel','Mittel','Mittel','Mittel–Stark','Stark','Stark','Sehr stark','Stärkster Schmerz'];

  return (
    <div className="vas-container">
      <div className="vas-label-row">
        <span>0 – Kein Schmerz</span>
        <span>10 – Stärkster Schmerz</span>
      </div>
      <div
        className="vas-track"
        ref={trackRef}
        onMouseDown={e => { updateFromEvent(e); }}
        onMouseMove={e => { if (e.buttons === 1) updateFromEvent(e); }}
        onTouchStart={updateFromEvent}
        onTouchMove={updateFromEvent}
        style={{ cursor: 'pointer' }}
      >
        <div className="vas-gradient" />
        {value !== null && (
          <div
            className="vas-thumb"
            style={{ left: `${(value / 10) * 100}%` }}
          />
        )}
      </div>
      <div className="vas-number-row">
        {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
          <span key={n} className="vas-number">{n}</span>
        ))}
      </div>
      {value !== null && (
        <>
          <div className="vas-value-display">{value} / 10</div>
          <div className="vas-value-label">{PAIN_LABELS[value]}</div>
        </>
      )}
    </div>
  );
}

// ── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function PatientFlow({ state, api }) {
  const [localStep, setLocalStep] = useState('welcome');
  const [freitext, setFreitext]   = useState('');
  const [vasValue, setVasValue]   = useState(null);
  const [bodyParts, setBodyParts] = useState([]);
  const [calDate, setCalDate]     = useState(null);

  // Wenn Konsultation neu startet, zurück zum Willkommensbildschirm
  useEffect(() => {
    if (state.phase === 'welcome') {
      setLocalStep('welcome');
    }
  }, [state.phase]);

  const { dot, label } = tabletStatus(state.phase);
  const aktuelleQ = state.currentQuestion;

  function resetAnswerState() {
    setFreitext('');
    setVasValue(null);
    setBodyParts([]);
    setCalDate(null);
  }

  function inhalt() {
    if (state.phase === 'welcome') {
      if (localStep === 'welcome')
        return <WillkommenBildschirm onStart={() => setLocalStep('kategorie')} />;
      return <KategorieAuswahl onSelect={kat => post('/api/category', { category: kat })} />;
    }

    if (state.phase === 'waiting')
      return <WartenBildschirm kategorie={state.patientCategory} />;

    if (state.phase === 'called')
      return <AufgerufenBildschirm onReady={() => post('/api/patient-ready')} />;

    if (state.phase === 'consultation') {
      // Diagnose vom Arzt anzeigen
      if (state.diagnosisShown && !state.currentQuestion)
        return <DiagnoseBildschirm text={state.diagnosis} onOk={() => post('/api/diagnosis-ack')} />;

      if (!aktuelleQ) return <VerbundenBildschirm />;

      if (state.currentAnswer)
        return <GeantwortetBildschirm antwort={state.currentAnswer} />;

      return (
        <FrageBildschirm
          frage={aktuelleQ}
          freitext={freitext}
          setFreitext={setFreitext}
          vasValue={vasValue}
          setVasValue={setVasValue}
          bodyParts={bodyParts}
          setBodyParts={setBodyParts}
          calDate={calDate}
          setCalDate={setCalDate}
          onAntwort={text => { resetAnswerState(); post('/api/answer', { text }); }}
        />
      );
    }

    if (state.phase === 'finishing')
      return (
        <ZusammenfassungAnfrageBildschirm
          onJa={() => post('/api/summary-request', { wants: true })}
          onNein={() => post('/api/summary-request', { wants: false })}
        />
      );

    if (state.phase === 'summary') {
      const qaPaare = getQAPaare(state.conversation);
      return (
        <ZusammenfassungBildschirm
          kategorie={state.patientCategory}
          qaPaare={qaPaare}
          diagnosis={state.diagnosis}
          onBestaetigen={() => post('/api/summary-confirm', { confirmed: true })}
          onAblehnen={() => post('/api/summary-confirm', { confirmed: false })}
        />
      );
    }

    if (state.phase === 'done') return <FertigBildschirm />;
    return null;
  }

  return (
    <div className="patient-tablet">
      <div className="tablet-header">
        <div className="tablet-logo">
          <div className="tablet-logo-mark"><img src={logo} style={{ width: '160px', height: 'auto', marginLeft: '90px'}} /></div>
          {/* <span className="tablet-logo-name">ClearConnect</span> */}
        </div>
        <div className="tablet-status">
          <div className={`status-dot ${dot}`} />
          {label}
        </div>
      </div>
      <div className="tablet-card">
        {inhalt()}
      </div>
    </div>
  );
}

// ── Hilfsfunktion ────────────────────────────────────────────────────────────
function getQAPaare(conversation) {
  const paare = [];
  let aktuelleQ = null;
  for (const msg of conversation) {
    if (msg.sender === 'doctor')             { aktuelleQ = msg.text; }
    else if (msg.sender === 'patient' && aktuelleQ) {
      paare.push({ q: aktuelleQ, a: msg.text });
      aktuelleQ = null;
    }
  }
  return paare;
}

// ── Bildschirme ──────────────────────────────────────────────────────────────

function WillkommenBildschirm({ onStart }) {
  const videoRef = useRef(null);

  return (
    <div className="tablet-welcome">
      <div className="welcome-mark"><img src={logo} style={{ width: '160px', height: 'auto'}} /></div>
      <div className="welcome-title">Willkommen</div>
      <div className="welcome-sub">
        Dieses Tablet hilft Ihnen, mit Ihrem Arzt zu sprechen. Tippen Sie auf die Buttons, um zu antworten.
      </div>

      <div className="welcome-video">
        <video
          ref={videoRef}
          src={erklaervideo}
          controls
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      <button className="btn-start" onClick={onStart}>
        Weiter
      </button>
    </div>
  );
}

function KategorieAuswahl({ onSelect }) {
  return (
    <div className="tablet-category">
      <div className="tablet-step-label">Schritt 1</div>
      <div className="tablet-big-title">Warum sind Sie heute hier?</div>
      <div className="tablet-hint">Bitte tippen Sie auf eine Karte</div>
      <div className="category-grid">
        <button className="category-btn pain"       onClick={() => onSelect('pain')}>
          <span className="cat-icon">+</span>Schmerzen
        </button>
        <button className="category-btn checkup"    onClick={() => onSelect('checkup')}>
          <span className="cat-icon">V</span>Vorsorge
        </button>
        <button className="category-btn medication" onClick={() => onSelect('medication')}>
          <span className="cat-icon">M</span>Medikamente
        </button>
        <button className="category-btn other"      onClick={() => onSelect('other')}>
          <span className="cat-icon">?</span>Sonstiges
        </button>
      </div>
    </div>
  );
}

function WartenBildschirm({ kategorie }) {
  return (
    <div className="tablet-waiting">
      <div className="waiting-anim">...</div>
      <div className="waiting-title">Bitte warten</div>
      <div className="waiting-sub">Der Arzt ruft Sie gleich auf.</div>
      <div className="reason-chip">Ihr Anliegen: {KATEGORIE_TEXT[kategorie] ?? kategorie}</div>
    </div>
  );
}

function AufgerufenBildschirm({ onReady }) {
  return (
    <div className="tablet-called">
      <div className="called-tag">DER ARZT IST BEREIT</div>
      <div className="called-anim">→</div>
      <div className="called-title">Bitte kommen Sie ins Untersuchungszimmer</div>
      <div className="called-sub">Please come to the examination room.</div>
      <button className="btn-tablet-primary" onClick={onReady}>
        Verstanden
      </button>
    </div>
  );
}

function VerbundenBildschirm() {
  return (
    <div className="tablet-connected">
      <div className="connected-anim">✓</div>
      <div className="connected-title">Sie sind verbunden</div>
      <div className="connected-sub">Bitte warten Sie auf die nächste Frage…</div>
    </div>
  );
}

function GeantwortetBildschirm({ antwort }) {
  return (
    <div className="tablet-answered">
      <div className="connected-anim">✓</div>
      <div className="connected-title">Antwort gesendet</div>
      <div className="connected-sub">„{antwort}"</div>
      <div className="connected-sub" style={{ marginTop: 4 }}>Warte auf die nächste Frage…</div>
    </div>
  );
}

function DiagnoseBildschirm({ text, onOk }) {
  return (
    <div className="tablet-diagnosis">
      <div className="diagnosis-icon">i</div>
      <div className="diagnosis-title">Mitteilung des Arztes</div>
      <div className="diagnosis-text-box">{text}</div>
      <button className="btn-diagnosis-ok" onClick={onOk}>
        Verstanden
      </button>
    </div>
  );
}

function FrageBildschirm({ frage, freitext, setFreitext, vasValue, setVasValue, bodyParts, setBodyParts, calDate, setCalDate, onAntwort }) {
  const type = frage.type;

  // Was soll als Antwort gesendet werden?
  function getAntwort() {
    if (type === 'scale')    return vasValue !== null ? `Schmerzstufe: ${vasValue}/10` : null;
    if (type === 'body')     return bodyParts.length > 0 ? `Ort: ${bodyParts.join(', ')}` : null;
    if (type === 'calendar') return calDate ? `Datum: ${calDate}` : null;
    return freitext.trim() || null;
  }

  const antwort = getAntwort();

  return (
    <div className="tablet-question">
      {/* Frage */}
      <div className="question-top">
        <div className="doctor-asks-label">Der Arzt fragt</div>
        <div className="question-text">{frage.text}</div>
      </div>

      {/* GIF / Gebärdensprache */}
      <div className="sign-lang-area">
        <video
          src={`/videos/${frage.id}.mp4`}
          loop autoPlay muted playsInline
          className="sign-lang-video"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
        <div className="sign-lang-placeholder" style={{ display: 'none' }}>
          <div className="sign-lang-icon">GS</div>
          <span>Gebärdensprache-Video (Platzhalter)</span>
        </div>
      </div>

      {/* Antwortbereich */}
      <div className="answer-area">
        <div className="answer-area-label">Ihre Antwort</div>

        {/* Ja/Nein */}
        {type === 'yesno' && (
          <div className="yesno-row">
            <button className="btn-yes" onClick={() => onAntwort('Ja')}>Ja</button>
            <button className="btn-no"  onClick={() => onAntwort('Nein')}>Nein</button>
          </div>
        )}

        {/* VAS-Skala */}
        {type === 'scale' && (
          <VASScale onSelect={v => setVasValue(v)} />
        )}

        {/* Körpermodell */}
        {type === 'body' && (
          <BodyModel onSelect={parts => setBodyParts(parts)} />
        )}

        {/* Kalender */}
        {type === 'calendar' && (
          <PatientCalendar onSelect={d => setCalDate(d)} />
        )}

        {/* Freitext (immer sichtbar außer bei body) */}
        {type !== 'body' && type !== 'calendar' && (
          <textarea
            className="free-text-input"
            placeholder="Oder schreiben Sie Ihre Antwort hier…"
            value={freitext}
            onChange={e => setFreitext(e.target.value)}
            rows={2}
          />
        )}

        {/* Ich weiß nicht */}
        <button className="btn-dont-know" onClick={() => onAntwort('Ich weiß nicht')}>
          Ich weiß nicht / Keine Angabe
        </button>

        {/* Antwort senden */}
        {antwort && (
          <button className="btn-send-answer" onClick={() => onAntwort(antwort)}>
            Antwort senden
          </button>
        )}
      </div>
    </div>
  );
}

function ZusammenfassungAnfrageBildschirm({ onJa, onNein }) {
  return (
    <div className="tablet-finishing">
      <div className="finishing-mark">?</div>
      <div className="finishing-title">Möchten Sie eine Zusammenfassung erhalten?</div>
      <div className="finishing-sub">Would you like a summary of today's visit?</div>
      <div className="finishing-buttons">
        <button className="btn-ja"   onClick={onJa}>Ja</button>
        <button className="btn-nein" onClick={onNein}>Nein</button>
      </div>
    </div>
  );
}

function ZusammenfassungBildschirm({ kategorie, qaPaare, diagnosis, onBestaetigen, onAblehnen }) {
  const hinweise = [
    'Bitte nehmen Sie Ihre Medikamente wie besprochen ein.',
    'Ruhen Sie sich aus und schonen Sie sich bei Bedarf.',
    'Melden Sie sich bei uns, wenn Sie sich schlechter fühlen.',
  ];

  return (
    <div className="tablet-summary">
      <div className="summary-top">
        <div className="summary-top-title">Ihre Zusammenfassung</div>
        <div className="summary-top-sub">Bitte kurz prüfen</div>
      </div>

      <div className="summary-scroll">
        <div>
          <div className="patient-greeting">Hallo</div>
          <div className="patient-greeting-sub">Hier ist eine kurze Übersicht Ihres heutigen Besuchs.</div>
        </div>

        <div className="summary-reason-card">
          <div className="summary-reason-label">Grund des Besuchs</div>
          <div className="summary-reason-value">{KATEGORIE_TEXT[kategorie] ?? kategorie}</div>
        </div>

        {diagnosis && (
          <div style={{ background: 'var(--yellow-50)', border: '2px solid var(--yellow-200)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow-700)', marginBottom: 6 }}>MITTEILUNG DES ARZTES</div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5 }}>{diagnosis}</div>
          </div>
        )}

        {qaPaare.length > 0 && (
          <div>
            <div className="summary-qa-title">Worüber wir gesprochen haben</div>
            {qaPaare.map((p, i) => (
              <div key={i} className="summary-qa-item">
                <div className="summary-qa-q">{p.q}</div>
                <div className="summary-qa-a">{p.a}</div>
              </div>
            ))}
          </div>
        )}

        <div className="summary-hints">
          <div className="summary-hints-title">Hinweise</div>
          {hinweise.map((h, i) => (
            <div key={i} className="summary-hint-item">
              <span className="summary-hint-dot" />
              {h}
            </div>
          ))}
        </div>
      </div>

      <div className="summary-confirm-section">
        <div className="summary-confirm-q">Ist diese Zusammenfassung richtig?</div>
        <div className="summary-confirm-btns">
          <button className="btn-confirm-yes" onClick={onBestaetigen}>Ja, stimmt</button>
          <button className="btn-confirm-no"  onClick={onAblehnen}>Nein</button>
        </div>
      </div>
    </div>
  );
}

function FertigBildschirm() {
  return (
    <div className="tablet-done">
      <div className="done-mark">✓</div>
      <div className="done-title">Vielen Dank!</div>
      <div className="done-sub">
        Ihr Besuch ist abgeschlossen.<br />
        Wir wünschen Ihnen gute Besserung.
      </div>
    </div>
  );
}
