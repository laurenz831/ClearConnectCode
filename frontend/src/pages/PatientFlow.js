import React, { useState, useRef, useCallback, useEffect } from 'react';
import { post } from '../services/api';
import BodyModel from '../components/Common/BodyModel';
import logo from '../assets/images/Logo.png';
import erklaervideo from '../assets/videos/erklaervideo.mp4';
import { KATEGORIE, KATEGORIE_KACHELN, formatTermin } from '../data/consultation';

function tabletStatus(phase) {
  if (phase === 'welcome' || phase === 'waiting') return { dot: 'waiting',   label: 'Wartend' };
  if (phase === 'called')                         return { dot: 'waiting',   label: 'Aufgerufen' };
  if (phase === 'done')                           return { dot: 'idle',      label: 'Beendet' };
  return                                                 { dot: 'connected', label: 'Verbunden' };
}

// ── Datumswahl (kompakt, native Datumsauswahl wie beim Kontrolltermin) ──────
function DatumFeld({ value, onSelect }) {
  // value im Format TT.MM.JJJJ (oder null); das Eingabefeld braucht JJJJ-MM-TT
  const iso = value ? value.split('.').reverse().join('-') : '';
  function aendern(v) {
    if (!v) { onSelect(null); return; }
    const [y, m, d] = v.split('-');
    onSelect(`${d}.${m}.${y}`);
  }
  return (
    <label className={`date-field${value ? ' on' : ''}`}>
      <span className="date-field-label">{value ? 'Gewähltes Datum' : 'Oder Datum wählen'}</span>
      <input
        className="date-field-input"
        type="date"
        value={iso}
        onChange={e => aendern(e.target.value)}
      />
    </label>
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
          <div className="vas-thumb" style={{ left: `${(value / 10) * 100}%` }} />
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
export default function PatientFlow({ state }) {
  const [localStep, setLocalStep] = useState('welcome');
  const [name, setName]           = useState('');

  // Wenn Konsultation neu startet, zurück zum Willkommensbildschirm
  useEffect(() => {
    if (state.phase === 'welcome') {
      setLocalStep('welcome');
      setName('');
    }
  }, [state.phase]);

  const { dot, label } = tabletStatus(state.phase);
  const aktuelleQ = state.currentQuestion;
  const mitteilung = state.currentMessage;

  function inhalt() {
    if (state.phase === 'welcome') {
      if (localStep === 'welcome')
        return <WillkommenBildschirm onStart={() => setLocalStep('name')} />;
      if (localStep === 'name')
        return <NameEingabe name={name} setName={setName} onWeiter={() => setLocalStep('kategorie')} />;
      return (
        <KategorieAuswahl
          onZurueck={() => setLocalStep('name')}
          onSelect={kat => post('/api/checkin', { name, category: kat })}
        />
      );
    }

    if (state.phase === 'waiting')
      return <WartenBildschirm kategorie={state.patientCategory} name={state.patientName} />;

    if (state.phase === 'called')
      return <AufgerufenBildschirm onReady={() => post('/api/patient-ready')} />;

    if (state.phase === 'consultation') {
      // Mitteilung vom Arzt anzeigen, bis sie gelesen/bestätigt ist
      if (mitteilung && !mitteilung.acked)
        return (
          <MitteilungBildschirm
            key={mitteilung.mid}
            msg={mitteilung}
            onOk={() => post('/api/message-ack', { accepted: true })}
            onAblehnen={kommentar => post('/api/message-ack', { accepted: false, comment: kommentar })}
          />
        );

      if (!aktuelleQ) return <VerbundenBildschirm />;

      if (state.currentAnswer)
        return <GeantwortetBildschirm antwort={state.currentAnswer} />;

      return (
        <FrageBildschirm
          key={aktuelleQ.qid}
          frage={aktuelleQ}
          onAntwort={text => post('/api/answer', { text })}
        />
      );
    }

    if (state.phase === 'finishing')
      return <ZusammenfassungWartenBildschirm korrektur={state.summary?.status === 'rejected'} />;

    if (state.phase === 'summary')
      return (
        <ZusammenfassungBildschirm
          key={state.summary?.text}
          text={state.summary?.text ?? ''}
          onBestaetigen={() => post('/api/summary-confirm', { confirmed: true })}
          onKorrektur={korrektur => post('/api/summary-confirm', { confirmed: false, correction: korrektur })}
        />
      );

    if (state.phase === 'confirmed') return <BestaetigtBildschirm />;

    if (state.phase === 'done') return <FertigBildschirm text={state.farewell} />;
    return null;
  }

  return (
    <div className="patient-tablet">
      <div className="tablet-header">
        <div className="tablet-logo">
          <div className="tablet-logo-mark"><img src={logo} alt="ClearConnect" style={{ width: '160px', height: 'auto', marginLeft: '90px'}} /></div>
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

// ── Bildschirme ──────────────────────────────────────────────────────────────

function WillkommenBildschirm({ onStart }) {
  const videoRef = useRef(null);

  return (
    <div className="tablet-welcome">
      <div className="welcome-mark"><img src={logo} alt="ClearConnect" style={{ width: '160px', height: 'auto'}} /></div>
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

function NameEingabe({ name, setName, onWeiter }) {
  const ok = name.trim().length > 1;
  return (
    <div className="tablet-category">
      <div className="tablet-step-label">Schritt 1</div>
      <div className="tablet-big-title">Wie heißen Sie?</div>
      <div className="tablet-hint">Bitte geben Sie Vor- und Nachnamen ein</div>
      <input
        className="name-input"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && ok) onWeiter(); }}
        placeholder="Vorname Nachname"
        autoComplete="off"
        autoCapitalize="words"
      />
      <button className="btn-send-answer" onClick={onWeiter} disabled={!ok}>
        Weiter
      </button>
    </div>
  );
}

function KategorieAuswahl({ onSelect, onZurueck }) {
  return (
    <div className="tablet-category">
      <div className="tablet-step-label">Schritt 2</div>
      <div className="tablet-big-title">Warum sind Sie heute hier?</div>
      <div className="tablet-hint">Bitte tippen Sie auf eine Karte</div>
      <div className="category-grid">
        {KATEGORIE_KACHELN.map(k => (
          <button key={k.key} className={`category-btn ${k.key}`} onClick={() => onSelect(k.key)}>
            <span className="cat-icon">{k.icon}</span>{KATEGORIE[k.key]}
          </button>
        ))}
      </div>
      <button className="btn-dont-know" onClick={onZurueck}>‹ Zurück zur Namenseingabe</button>
    </div>
  );
}

function WartenBildschirm({ kategorie, name }) {
  return (
    <div className="tablet-waiting">
      <div className="waiting-anim">...</div>
      <div className="waiting-title">Bitte warten</div>
      <div className="waiting-sub">Der Arzt ruft Sie gleich auf.</div>
      {name && <div className="reason-chip">{name}</div>}
      <div className="reason-chip">Ihr Anliegen: {KATEGORIE[kategorie] ?? kategorie}</div>
    </div>
  );
}

function AufgerufenBildschirm({ onReady }) {
  return (
    <div className="tablet-called">
      <div className="called-tag">DER ARZT IST BEREIT</div>
      <div className="called-anim">→</div>
      <div className="called-title">Bitte kommen Sie ins Untersuchungszimmer</div>
      <div className="called-sub">Tippen Sie auf den Button, wenn Sie im Zimmer sind.</div>
      <button className="btn-tablet-primary" onClick={onReady}>
        Ich bin im Arztzimmer
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

function MitteilungBildschirm({ msg, onOk, onAblehnen }) {
  const [ablehnen, setAblehnen]   = useState(false);
  const [kommentar, setKommentar] = useState('');
  return (
    <div className="tablet-diagnosis">
      <div className="diagnosis-icon">i</div>
      <div className="diagnosis-title">Mitteilung des Arztes</div>
      {msg.text && <div className="diagnosis-text-box" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>}

      {msg.exams && (
        <div className="msg-exams-box">
          <div className="msg-box-label">Folgende Untersuchungen werden gemacht</div>
          {msg.exams.map(e => (
            <div key={e} className="msg-exam-item"><span className="msg-exam-check">✓</span>{e}</div>
          ))}
        </div>
      )}

      {msg.appointment && (
        <div className="msg-appointment-box">
          <div className="msg-box-label">{msg.appointment.label || 'Termin'}</div>
          <div className="msg-appointment-date">{formatTermin(msg.appointment)}</div>
        </div>
      )}

      {!msg.requiresAck && (
        <button className="btn-diagnosis-ok" onClick={onOk}>Verstanden</button>
      )}

      {msg.requiresAck && !ablehnen && (
        <div className="ack-buttons">
          <button className="btn-confirm-yes" onClick={onOk}>Bestätigen</button>
          <button className="btn-confirm-no" onClick={() => setAblehnen(true)}>Ablehnen</button>
        </div>
      )}

      {msg.requiresAck && ablehnen && (
        <div className="ack-decline">
          <div className="summary-confirm-q">Was ist unklar oder stimmt nicht? (optional)</div>
          <textarea
            className="free-text-input"
            placeholder="Ihre Anmerkung…"
            value={kommentar}
            onChange={e => setKommentar(e.target.value)}
            rows={2}
            autoFocus
          />
          <div className="ack-buttons">
            <button className="btn-confirm-no" onClick={() => setAblehnen(false)}>Zurück</button>
            <button className="btn-decline-send" onClick={() => onAblehnen(kommentar.trim())}>Ablehnung senden</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FrageBildschirm({ frage, onAntwort }) {
  const type = frage.type;
  const [freitext, setFreitext]   = useState('');
  const [vasValue, setVasValue]   = useState(null);
  const [bodyParts, setBodyParts] = useState([]);
  const [calDate, setCalDate]     = useState(null);
  const [auswahl, setAuswahl]     = useState([]);
  const [zahl, setZahl]           = useState('');

  function toggleOption(o) {
    setCalDate(null);
    if (frage.multi) setAuswahl(a => a.includes(o) ? a.filter(x => x !== o) : [...a, o]);
    else setAuswahl(a => a[0] === o ? [] : [o]);
  }

  // Was soll als Antwort gesendet werden?
  function getAntwort() {
    const zusatz = freitext.trim();
    let haupt = null;
    if (type === 'scale')  haupt = vasValue !== null ? `${vasValue} von 10` : null;
    if (type === 'body')   haupt = bodyParts.length > 0 ? bodyParts.join(', ') : null;
    if (type === 'number') haupt = zahl.trim() ? `${zahl.trim()} ${frage.unit || ''}`.trim() : null;
    if (type === 'choice' || type === 'calendar') {
      if (auswahl.length) haupt = auswahl.join(', ');
      else if (calDate)   haupt = frage.datePrefix ? `${frage.datePrefix} ${calDate}` : calDate;
    }
    if (type === 'yesno' || type === 'text') return zusatz || null;
    if (haupt && zusatz) return `${haupt} – ${zusatz}`;
    return haupt || zusatz || null;
  }

  const antwort = getAntwort();
  const zeigtKalender = type === 'calendar' || (type === 'choice' && frage.calendar);

  return (
    <div className="tablet-question">
      {/* Frage */}
      <div className="question-top">
        <div className="doctor-asks-label">Der Arzt fragt</div>
        <div className="question-text">{frage.text}</div>
      </div>

      {/* Gebärdensprache-Video (falls vorhanden) */}
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

        {/* Auswahl */}
        {type === 'choice' && (
          <>
            {frage.multi && <div className="choice-hint">Mehrere Antworten möglich</div>}
            <div className="choice-grid">
              {(frage.options || []).map(o => (
                <button
                  key={o}
                  className={`btn-choice${auswahl.includes(o) ? ' on' : ''}`}
                  onClick={() => toggleOption(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Zahl */}
        {type === 'number' && (
          <div className="number-row">
            <input
              className="number-input"
              type="number"
              inputMode="decimal"
              value={zahl}
              onChange={e => setZahl(e.target.value)}
              placeholder="0"
            />
            {frage.unit && <span className="number-unit">{frage.unit}</span>}
          </div>
        )}

        {/* VAS-Skala */}
        {type === 'scale' && <VASScale onSelect={v => setVasValue(v)} />}

        {/* Körpermodell */}
        {type === 'body' && (
          <>
            <BodyModel onSelect={parts => setBodyParts(parts)} />
            <button className="btn-no" onClick={() => onAntwort('Nein / keine Stelle')}>
              Nein / keine Stelle
            </button>
          </>
        )}

        {/* Datum (eigener Typ oder zusätzlich zur Auswahl) */}
        {zeigtKalender && (
          <DatumFeld value={calDate} onSelect={d => { setCalDate(d); if (d) setAuswahl([]); }} />
        )}

        {/* Freitext */}
        <textarea
          className="free-text-input"
          placeholder={type === 'text' ? 'Schreiben Sie Ihre Antwort hier…' : 'Oder schreiben Sie hier (optional)…'}
          value={freitext}
          onChange={e => setFreitext(e.target.value)}
          rows={2}
        />

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

function ZusammenfassungWartenBildschirm({ korrektur }) {
  return (
    <div className="tablet-connected">
      <div className="connected-anim">…</div>
      <div className="connected-title">
        {korrektur ? 'Ihre Anmerkung wurde gesendet' : 'Das Gespräch ist beendet'}
      </div>
      <div className="connected-sub">
        {korrektur
          ? 'Die Zusammenfassung wird korrigiert. Bitte warten Sie…'
          : 'Die Zusammenfassung wird erstellt. Bitte warten Sie…'}
      </div>
    </div>
  );
}

function ZusammenfassungBildschirm({ text, onBestaetigen, onKorrektur }) {
  const [korrigieren, setKorrigieren] = useState(false);
  const [anmerkung, setAnmerkung]     = useState('');

  return (
    <div className="tablet-summary">
      <div className="summary-top">
        <div className="summary-top-title">Ihre Zusammenfassung</div>
        <div className="summary-top-sub">Bitte lesen und prüfen Sie Ihre Angaben</div>
      </div>

      <div className="summary-scroll">
        <div className="summary-text-box">{text}</div>
      </div>

      <div className="summary-confirm-section">
        {!korrigieren ? (
          <>
            <div className="summary-confirm-q">Ist diese Zusammenfassung richtig?</div>
            <div className="summary-confirm-btns">
              <button className="btn-confirm-yes" onClick={onBestaetigen}>Ja, stimmt</button>
              <button className="btn-confirm-no"  onClick={() => setKorrigieren(true)}>Nein, etwas stimmt nicht</button>
            </div>
          </>
        ) : (
          <>
            <div className="summary-confirm-q">Was stimmt nicht?</div>
            <textarea
              className="free-text-input"
              placeholder="Bitte beschreiben Sie, was korrigiert werden soll…"
              value={anmerkung}
              onChange={e => setAnmerkung(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="summary-confirm-btns" style={{ marginTop: 15 }}>
              <button className="btn-confirm-no" onClick={() => setKorrigieren(false)}>Zurück</button>
              <button
                className="btn-confirm-yes"
                disabled={!anmerkung.trim()}
                onClick={() => onKorrektur(anmerkung.trim())}
              >
                Anmerkung senden
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BestaetigtBildschirm() {
  return (
    <div className="tablet-connected">
      <div className="connected-anim">✓</div>
      <div className="connected-title">Danke für Ihre Bestätigung</div>
      <div className="connected-sub">Bitte warten Sie auf die Verabschiedung…</div>
    </div>
  );
}

function FertigBildschirm({ text }) {
  return (
    <div className="tablet-done">
      <div className="done-mark">✓</div>
      <div className="done-title">Auf Wiedersehen</div>
      {text
        ? <div className="farewell-box">{text}</div>
        : <div className="done-sub">Ihr Besuch ist abgeschlossen.</div>}
    </div>
  );
}
