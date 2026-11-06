import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationHistory from '../components/Doctor/ConversationHistory';
import questions from '../data/questions';
import { post } from '../services/api';
import {
  KATEGORIE, mitteilungsVorlagen, UNTERSUCHUNGEN, VERABSCHIEDUNG, FOLGETERMIN_ZUSATZ,
  formatTermin, getQAPaare, zusammenfassungsEntwurf, initialen,
} from '../data/consultation';

const TYPE_LABELS = {
  yesno:    'Ja/Nein',
  scale:    'VAS',
  text:     'Text',
  body:     'Körper',
  calendar: 'Kalender',
  choice:   'Auswahl',
  number:   'Zahl',
};

function patientStatus(phase) {
  if (phase === 'waiting')      return { cls: 'waiting', label: 'Wartet' };
  if (phase === 'called')       return { cls: 'waiting', label: 'Aufgerufen' };
  if (phase === 'consultation') return { cls: 'active',  label: 'In Konsultation' };
  return                               { cls: 'standby', label: 'Standby' };
}

export default function DoctorDashboard({ state }) {
  const navigate = useNavigate();
  const [ausgewaehlteQ, setAusgewaehlteQ] = useState(null);
  const [eigeneQ, setEigeneQ]             = useState('');
  const [eigeneQTyp, setEigeneQTyp]       = useState('text');
  const [suche, setSuche]                 = useState('');
  const [collapsed, setCollapsed]         = useState({});

  if (['finishing', 'summary', 'confirmed', 'done'].includes(state.phase)) {
    return <AbschlussAnsicht state={state} navigate={navigate} />;
  }

  const kannPatientAufrufen = state.phase === 'waiting';
  const kannFrageSenden     = state.phase === 'consultation';
  const hatPatient          = state.patientCategory !== null;
  const hatAuswahl          = ausgewaehlteQ !== null || eigeneQ.trim().length > 0;

  const { cls, label } = patientStatus(state.phase);

  const gefilterteKategorien = questions
    .map(k => ({ ...k, items: k.items.filter(q => q.text.toLowerCase().includes(suche.toLowerCase())) }))
    .filter(k => k.items.length > 0);

  const gesamtAnzahl = questions.reduce((s, k) => s + k.items.length, 0);

  function frageSenden() {
    const q = ausgewaehlteQ
      ? ausgewaehlteQ
      : eigeneQ.trim() ? { text: eigeneQ.trim(), category: 'Eigene Frage', type: eigeneQTyp } : null;
    if (!q) return;
    post('/api/question', q);
    setAusgewaehlteQ(null);
    setEigeneQ('');
  }

  const msg = state.currentMessage;

  return (
    <div className="doctor-dashboard">
      {/* Header */}
      <header className="doctor-header">
        <button className="btn-header btn-back" onClick={() => navigate('/doctor')}>
          ← Übersicht
        </button>
        <div className="logo">
          <div className="logo-mark">CC</div>
          <div>
            <div className="logo-name">ClearConnect</div>
            <div className="logo-sub">Konsultation</div>
          </div>
        </div>

        {hatPatient && (
          <>
            <div className="header-divider" />
            <div className="patient-info">
              <div className="patient-avatar">{initialen(state.patientName)}</div>
              <div>
                <div className="patient-name">{state.patientName || 'Name nicht angegeben'}</div>
                <div className="patient-meta">Eingecheckt um {state.startedAt}</div>
              </div>
              <span className={`status-badge ${cls}`}>{label}</span>
              <span className="reason-badge">{KATEGORIE[state.patientCategory] ?? state.patientCategory}</span>
            </div>
          </>
        )}

        {!hatPatient && (
          <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
            Warte auf Patienten-Eincheck…
          </div>
        )}

        <div className="header-actions">
          {['welcome', 'waiting'].includes(state.phase) && (
            <button
              className="btn-header btn-call"
              onClick={() => post('/api/call-patient')}
              disabled={!kannPatientAufrufen}
            >
              Patient aufrufen
            </button>
          )}

          {state.phase === 'consultation' && (
            <button className="btn-header btn-end" onClick={() => post('/api/finish-consultation')}>
              Gespräch beenden
            </button>
          )}

          <button
            className="btn-header btn-send-q"
            onClick={frageSenden}
            disabled={!kannFrageSenden || !hatAuswahl}
          >
            Frage senden
          </button>
        </div>
      </header>

      {/* Hauptbereich */}
      <div className="doctor-body">

        {/* LINKS: Fragebibliothek */}
        <aside className="questions-library">
          <div className="panel-title">
            <span>Fragebibliothek</span>
            <span className="count-badge">{gesamtAnzahl}</span>
          </div>
          <div className="search-box">
            <input
              className="search-input"
              placeholder="Suchen…"
              value={suche}
              onChange={e => setSuche(e.target.value)}
            />
          </div>
          <div className="question-list">
            {gefilterteKategorien.map(kat => (
              <div key={kat.category}>
                <button
                  className="category-header"
                  onClick={() => setCollapsed(p => ({ ...p, [kat.category]: !p[kat.category] }))}
                >
                  <span style={{ width: 18, textAlign: 'center', fontWeight: 900 }}>{kat.icon}</span>
                  <span>{kat.category.toUpperCase()}</span>
                  <span className="cat-count">{kat.items.length}</span>
                  <span style={{ marginLeft: 'auto' }}>{collapsed[kat.category] ? '›' : '⌄'}</span>
                </button>

                {!collapsed[kat.category] && kat.items.map(q => (
                  <button
                    key={q.id}
                    className={`question-item ${ausgewaehlteQ?.id === q.id ? 'selected' : ''}`}
                    onClick={() => { setAusgewaehlteQ({ ...q, category: kat.category }); setEigeneQ(''); }}
                    disabled={!kannFrageSenden}
                  >
                    <span className={`q-type-pill ${q.type}`}>{TYPE_LABELS[q.type]}</span>
                    <span>{q.text}</span>
                  </button>
                ))}
              </div>
            ))}
            {gefilterteKategorien.length === 0 && (
              <div style={{ padding: 16, fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
                Keine Fragen gefunden
              </div>
            )}
          </div>
        </aside>

        {/* MITTE: Aktuelle Interaktion */}
        <main className="current-interaction">
          <div className="interaction-header">
            <div>
              <div className="interaction-title">Aktuelle Interaktion</div>
              <div className="interaction-sub">Live-Austausch mit dem Patienten</div>
            </div>
            {state.currentQuestion && state.currentAnswer  && <span className="status-pill answered">Beantwortet</span>}
            {state.currentQuestion && !state.currentAnswer && <span className="status-pill awaiting">Warte auf Antwort</span>}
            {msg && !msg.acked && <span className="status-pill awaiting">{msg.requiresAck ? 'Warte auf Bestätigung' : 'Mitteilung angezeigt'}</span>}
            {msg && msg.acked && !msg.declined && <span className="status-pill answered">{msg.requiresAck ? 'Bestätigt' : 'Gelesen'}</span>}
            {msg && msg.declined && <span className="status-pill declined">Abgelehnt</span>}
          </div>

          <div className="interaction-body">
            {state.phase === 'called' && (
              <div className="info-banner">Patient:in wurde aufgerufen. Warte, bis das Betreten des Arztzimmers am Tablet bestätigt wird…</div>
            )}

            {ausgewaehlteQ && (
              <div className="preview-card">
                <div className="preview-label">VORSCHAU · BEREIT ZUM SENDEN</div>
                <span className="preview-cat">{ausgewaehlteQ.category} · {TYPE_LABELS[ausgewaehlteQ.type]}{ausgewaehlteQ.unit ? ` (${ausgewaehlteQ.unit})` : ''}</span>
                <div className="preview-text">{ausgewaehlteQ.text}</div>
                {ausgewaehlteQ.options && (
                  <div className="preview-options">
                    {ausgewaehlteQ.options.map(o => <span key={o} className="preview-option">{o}</span>)}
                    {ausgewaehlteQ.calendar && <span className="preview-option">+ Kalender</span>}
                    {ausgewaehlteQ.multi && <span className="preview-option muted">Mehrfachauswahl</span>}
                  </div>
                )}
              </div>
            )}

            {state.currentQuestion && (
              <>
                <div>
                  <div className="section-label">GESENDETE FRAGE</div>
                  <div className="sent-bubble">{state.currentQuestion.text}</div>
                </div>
                <div>
                  <div className="section-label">PATIENTENANTWORT</div>
                  {state.currentAnswer
                    ? <div className="answer-card">{state.currentAnswer}</div>
                    : <div className="waiting-answer">Warte auf Antwort des Patienten…</div>
                  }
                </div>
              </>
            )}

            {msg && (
              <div className={`message-status-card ${msg.declined ? 'declined' : msg.acked ? 'acked' : ''}`}>
                <div className="section-label">GESENDETE MITTEILUNG · {msg.time}</div>
                {msg.text && <div className="message-status-text">{msg.text}</div>}
                {msg.exams && <div className="message-status-extra">Untersuchungen: {msg.exams.join(', ')}</div>}
                {msg.appointment && <div className="message-status-extra">{msg.appointment.label}: {formatTermin(msg.appointment)}</div>}
                <div className="message-status-state">
                  {msg.declined
                    ? `✗ Von Patient:in abgelehnt${msg.comment ? ': „' + msg.comment + '“' : ' (ohne Begründung)'}`
                    : msg.acked
                    ? (msg.requiresAck ? '✓ Von Patient:in bestätigt' : '✓ Von Patient:in gelesen')
                    : (msg.requiresAck ? 'Warte auf Bestätigung…' : 'Wird am Tablet angezeigt…')}
                </div>
              </div>
            )}

            {!ausgewaehlteQ && !state.currentQuestion && !msg && state.phase !== 'called' && (
              <div className="empty-state">
                <div className="empty-icon">→</div>
                <div className="empty-title">Frage oder Mitteilung wählen</div>
                <div className="empty-sub">
                  {state.phase === 'waiting'
                    ? 'Rufen Sie zuerst den Patienten auf.'
                    : state.phase === 'consultation'
                      ? 'Wählen Sie links eine Frage, senden Sie unten eine Mitteilung oder tippen Sie eine eigene Frage.'
                      : 'Warten Sie, bis der Patient eingecheckt hat.'}
                </div>
              </div>
            )}

            {kannFrageSenden && <MitteilungsPanel kategorie={state.patientCategory} />}
          </div>

          {/* Eigene Frage */}
          <div className="custom-q-area">
            <div className="custom-q-label">
              EIGENE FRAGE
              <select
                className="custom-q-type"
                value={eigeneQTyp}
                onChange={e => setEigeneQTyp(e.target.value)}
                disabled={!kannFrageSenden}
              >
                <option value="text">Antwort: Freitext</option>
                <option value="yesno">Antwort: Ja / Nein</option>
              </select>
            </div>
            <div className="custom-q-row">
              <textarea
                className="custom-textarea"
                placeholder={kannFrageSenden ? 'Eigene Frage eingeben… (Strg+Enter zum Senden)' : 'Rufen Sie zuerst den Patienten auf…'}
                value={eigeneQ}
                onChange={e => { setEigeneQ(e.target.value); setAusgewaehlteQ(null); }}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') frageSenden(); }}
                disabled={!kannFrageSenden}
                rows={2}
              />
              <button
                className="btn-send-primary"
                onClick={frageSenden}
                disabled={!kannFrageSenden || !hatAuswahl}
              >
                Senden
              </button>
            </div>
          </div>
        </main>

        {/* RECHTS: Gesprächsverlauf */}
        <aside className="conversation-history">
          <ConversationHistory conversation={state.conversation} />
        </aside>
      </div>
    </div>
  );
}

// ── Mitteilung an Patient:in (Vorlagen, Bestätigung, Termin, Untersuchungen) ──
function MitteilungsPanel({ kategorie }) {
  const vorlagen = mitteilungsVorlagen(kategorie);
  const [text, setText]               = useState('');
  const [requiresAck, setRequiresAck] = useState(false);
  const [inSummary, setInSummary]     = useState(true);
  const [mitTermin, setMitTermin]     = useState(false);
  const [termin, setTermin]           = useState({ label: 'Kontrolltermin', date: '', time: '' });
  const [mitUntersuchungen, setMitUntersuchungen] = useState(false);
  const [exams, setExams]             = useState([]);
  const [aktiveVorlage, setAktiveVorlage] = useState(null);
  const [summaryText, setSummaryText] = useState(null);

  function vorlageWaehlen(v) {
    setAktiveVorlage(v.key);
    setSummaryText(v.summaryText || null);
    setText(v.text);
    setRequiresAck(v.requiresAck);
    setInSummary(v.inSummary);
    setMitTermin(!!v.appointment);
    if (v.appointment) setTermin(v.appointment);
    setMitUntersuchungen(false);
    setExams([]);
  }

  function untersuchungenWaehlen() {
    setAktiveVorlage('untersuchungen');
    setSummaryText(null);
    setMitUntersuchungen(true);
    setText('');
    setInSummary(false); // landen ohnehin als "Geplante Untersuchungen" in der Zusammenfassung
    setMitTermin(false);
  }

  function toggleExam(e) {
    setExams(x => x.includes(e) ? x.filter(y => y !== e) : [...x, e]);
  }

  const hatInhalt = text.trim() || (mitUntersuchungen && exams.length) || (mitTermin && termin.date);

  function senden() {
    if (!hatInhalt) return;
    post('/api/message', {
      text,
      requiresAck,
      inSummary,
      summaryText: summaryText && text === vorlagen.find(v => v.key === aktiveVorlage)?.text ? summaryText : null,
      exams: mitUntersuchungen ? exams : null,
      appointment: mitTermin && termin.date ? termin : null,
    });
    setText(''); setAktiveVorlage(null); setSummaryText(null); setMitTermin(false);
    setMitUntersuchungen(false); setExams([]); setRequiresAck(false); setInSummary(true);
  }

  return (
    <div className="message-panel">
      <div className="diagnosis-label">
        MITTEILUNG AN PATIENT:IN
        <span style={{ fontSize: 13, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
          · keine Antwort nötig, optional Bestätigung
        </span>
      </div>

      <div className="template-row">
        {vorlagen.map(v => (
          <button
            key={v.key}
            className={`template-chip ${aktiveVorlage === v.key ? 'on' : ''}`}
            onClick={() => vorlageWaehlen(v)}
          >
            {v.label}
          </button>
        ))}
        <button
          className={`template-chip ${aktiveVorlage === 'untersuchungen' ? 'on' : ''}`}
          onClick={untersuchungenWaehlen}
        >
          Untersuchungen mitteilen
        </button>
      </div>

      <textarea
        className="diagnosis-textarea"
        placeholder="Mitteilung eingeben oder oben eine Vorlage wählen…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        style={{ width: '100%' }}
      />

      {mitUntersuchungen && (
        <div className="exam-grid">
          {UNTERSUCHUNGEN.map(e => (
            <label key={e} className={`exam-option ${exams.includes(e) ? 'on' : ''}`}>
              <input type="checkbox" checked={exams.includes(e)} onChange={() => toggleExam(e)} />
              {e}
            </label>
          ))}
        </div>
      )}

      {mitTermin && (
        <div className="appointment-row">
          <input
            className="appointment-input"
            value={termin.label}
            onChange={e => setTermin(t => ({ ...t, label: e.target.value }))}
            placeholder="Bezeichnung"
          />
          <input
            className="appointment-input"
            type="date"
            value={termin.date}
            onChange={e => setTermin(t => ({ ...t, date: e.target.value }))}
          />
          <input
            className="appointment-input"
            type="time"
            value={termin.time}
            onChange={e => setTermin(t => ({ ...t, time: e.target.value }))}
          />
        </div>
      )}

      <div className="message-options">
        <label><input type="checkbox" checked={requiresAck} onChange={e => setRequiresAck(e.target.checked)} /> Bestätigung anfordern</label>
        <label><input type="checkbox" checked={mitTermin} onChange={e => setMitTermin(e.target.checked)} /> Termin anhängen</label>
        <label><input type="checkbox" checked={mitUntersuchungen} onChange={e => setMitUntersuchungen(e.target.checked)} /> Untersuchungen anhängen</label>
        <label><input type="checkbox" checked={inSummary} onChange={e => setInSummary(e.target.checked)} /> In Zusammenfassung</label>
        <button className="btn-diagnosis" style={{ marginLeft: 'auto' }} onClick={senden} disabled={!hatInhalt}>
          Mitteilung senden
        </button>
      </div>
    </div>
  );
}

// ── Abschluss: Zusammenfassung, Korrektur, Verabschiedung, Bericht ───────────
function AbschlussAnsicht({ state, navigate }) {
  const [entwurf, setEntwurf]       = useState(() => state.summary?.text ?? zusammenfassungsEntwurf(state));
  const [abschied, setAbschied]     = useState(VERABSCHIEDUNG);
  const [folgetermin, setFolgetermin] = useState(state.patientCategory === 'checkup');

  // Nach einer Korrekturmeldung den zuletzt gesendeten Text weiterbearbeiten
  useEffect(() => {
    if (state.phase === 'finishing' && state.summary?.text) setEntwurf(state.summary.text);
  }, [state.phase, state.summary?.text]);

  const qaPaare  = getQAPaare(state.conversation);
  const kategorie = KATEGORIE[state.patientCategory] ?? state.patientCategory ?? '–';
  const datum    = new Date().toLocaleDateString('de-DE');
  const mitteilungen = (state.messages || []).filter(m => m.text !== 'OK');
  const abgelehnt = state.phase === 'finishing' && state.summary?.status === 'rejected';

  const abschiedText = folgetermin ? `${abschied}\n\n${FOLGETERMIN_ZUSATZ}` : abschied;

  const untertitel = {
    finishing: abgelehnt ? 'Patient:in hat eine Korrektur gemeldet' : 'Zusammenfassung prüfen und senden',
    summary:   'Patient:in prüft die Zusammenfassung…',
    confirmed: 'Zusammenfassung bestätigt – Verabschiedung senden',
    done:      'Konsultation abgeschlossen',
  }[state.phase];

  return (
    <div className="summary-screen">
      <div className="summary-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <div>
            <div className="summary-header-title">Abschluss der Konsultation</div>
            <div className="summary-header-sub">{untertitel}</div>
          </div>
        </div>
        <div className="summary-header-actions">
          <button className="btn-print" onClick={() => window.print()}>Drucken</button>
          <button className="btn-new" onClick={() => { post('/api/reset'); navigate('/doctor'); }}>
            Neue Konsultation
          </button>
        </div>
      </div>

      <div className="summary-content abschluss-grid">
        {/* Arbeitsbereich */}
        <div className="abschluss-panel">
          <div className={`abschluss-steps`}>
            <span className={state.phase === 'finishing' ? 'on' : 'done'}>1 · Zusammenfassung</span>
            <span className={state.phase === 'summary' ? 'on' : ['confirmed','done'].includes(state.phase) ? 'done' : ''}>2 · Bestätigung</span>
            <span className={state.phase === 'confirmed' ? 'on' : state.phase === 'done' ? 'done' : ''}>3 · Verabschiedung</span>
          </div>

          {state.phase === 'finishing' && (
            <>
              {abgelehnt && (
                <div className="correction-banner">
                  <strong>Korrektur von Patient:in:</strong>{' '}
                  {state.summary.correction || '(keine Angabe)'}
                  <div style={{ marginTop: 6, fontSize: 14 }}>Bitte Text anpassen und erneut senden.</div>
                </div>
              )}
              <div className="section-label">ZUSAMMENFASSUNG (automatisch erstellt, bearbeitbar)</div>
              <textarea
                className="summary-editor"
                value={entwurf}
                onChange={e => setEntwurf(e.target.value)}
                rows={16}
              />
              <div className="abschluss-actions">
                <button className="btn-print" onClick={() => setEntwurf(zusammenfassungsEntwurf(state))}>
                  Entwurf neu erzeugen
                </button>
                <button
                  className="btn-diagnosis"
                  disabled={!entwurf.trim()}
                  onClick={() => post('/api/summary', { text: entwurf })}
                >
                  {abgelehnt ? 'Korrigierte Fassung senden' : 'An Patient:in senden'}
                </button>
              </div>
            </>
          )}

          {state.phase === 'summary' && (
            <>
              <div className="waiting-patient-confirm">Warte, bis Patient:in die Zusammenfassung bestätigt…</div>
              <div className="summary-preview">{state.summary?.text}</div>
            </>
          )}

          {state.phase === 'confirmed' && (
            <>
              <div className="confirm-banner">✓ Zusammenfassung von Patient:in bestätigt</div>
              <div className="section-label">VERABSCHIEDUNG</div>
              <textarea
                className="summary-editor"
                value={abschied}
                onChange={e => setAbschied(e.target.value)}
                rows={4}
              />
              <label className="farewell-option">
                <input type="checkbox" checked={folgetermin} onChange={e => setFolgetermin(e.target.checked)} />
                Zusatz: „{FOLGETERMIN_ZUSATZ}“
              </label>
              <div className="abschluss-actions">
                <button className="btn-diagnosis" disabled={!abschied.trim()} onClick={() => post('/api/farewell', { text: abschiedText })}>
                  Verabschiedung senden
                </button>
              </div>
            </>
          )}

          {state.phase === 'done' && (
            <>
              <div className="confirm-banner">✓ Konsultation abgeschlossen. Verabschiedung wird am Tablet angezeigt.</div>
              <div className="summary-preview">{state.farewell}</div>
            </>
          )}
        </div>

        {/* Bericht */}
        <div className="report-card">
          <div className="report-header-bar">
            <div>
              <div className="report-logo">ClearConnect <span>Klinischer Bericht</span></div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>Konsultationszusammenfassung</div>
            </div>
            <div className="report-meta">
              <div>Arzt: Dr. A. Schultz</div>
              <div>Abt.: Innere Medizin</div>
            </div>
          </div>

          <div className="report-patient-row">
            <div><div className="report-field-label">PATIENT:IN</div><div className="report-field-value">{state.patientName || '–'}</div></div>
            <div><div className="report-field-label">BESUCHSGRUND</div><div className="report-field-value">{kategorie}</div></div>
            <div><div className="report-field-label">DATUM</div><div className="report-field-value">{datum}</div></div>
            <div><div className="report-field-label">BEGINN</div><div className="report-field-value">{state.startedAt || '–'}</div></div>
          </div>

          {qaPaare.length > 0 && (
            <div className="report-section">
              <div className="report-section-title">Strukturierte Anamnese</div>
              {qaPaare.map((p, i) => (
                <div key={i} className="qa-item">
                  <span className="qa-check">✓</span>
                  <span className="qa-q">{p.short || p.q}</span>
                  <span className="qa-arrow">→</span>
                  <span className="qa-a">{p.a}</span>
                </div>
              ))}
            </div>
          )}

          {mitteilungen.length > 0 && (
            <div className="report-section">
              <div className="report-section-title">Mitteilungen</div>
              {mitteilungen.map(m => (
                <div key={m.mid} className="qa-item">
                  <span className="qa-check">{m.declined ? '✗' : m.acked ? '✓' : '·'}</span>
                  <span className="qa-q" style={{ whiteSpace: 'pre-wrap' }}>
                    {m.text}
                    {m.exams ? ` [${m.exams.join(', ')}]` : ''}
                    {m.appointment ? ` [${m.appointment.label}: ${formatTermin(m.appointment)}]` : ''}
                  </span>
                  <span className="qa-a">{m.declined ? `abgelehnt${m.comment ? ': ' + m.comment : ''}` : m.requiresAck ? (m.acked ? 'bestätigt' : 'offen') : ''}</span>
                </div>
              ))}
            </div>
          )}

          {state.plannedExams?.length > 0 && (
            <div className="report-section">
              <div className="report-section-title">Geplante Untersuchungen</div>
              <div style={{ fontSize: 15 }}>{state.plannedExams.join(', ')}</div>
            </div>
          )}

          <div className="report-section">
            <div className="report-section-title">Zusammenfassung für Patient:in</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 6 }}>
              Status: {
                !state.summary ? 'noch nicht gesendet'
                : state.summary.status === 'confirmed' ? 'von Patient:in bestätigt'
                : state.summary.status === 'rejected' ? 'Korrektur gemeldet'
                : 'gesendet, Bestätigung ausstehend'
              }
            </div>
            {state.summary?.text && <div className="summary-preview">{state.summary.text}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
