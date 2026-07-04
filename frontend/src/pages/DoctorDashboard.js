import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationHistory from '../components/Doctor/ConversationHistory';
import questions from '../data/questions';
import { post } from '../services/api';

const KATEGORIE = {
  pain:       'Schmerzen',
  checkup:    'Vorsorge / Check-up',
  medication: 'Medikamente',
  other:      'Sonstiges',
};

const TYPE_LABELS = {
  yesno:    'Ja/Nein',
  scale:    'VAS',
  text:     'Text',
  body:     'Körper',
  calendar: 'Kalender',
};

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

function patientStatus(phase) {
  if (phase === 'waiting')      return { cls: 'waiting', label: 'Wartet' };
  if (phase === 'called')       return { cls: 'waiting', label: 'Aufgerufen' };
  if (phase === 'consultation') return { cls: 'active',  label: 'In Konsultation' };
  return                               { cls: 'standby', label: 'Standby' };
}

export default function DoctorDashboard({ state, api }) {
  const navigate = useNavigate();
  const [ausgewaehlteQ, setAusgewaehlteQ] = useState(null);
  const [eigeneQ, setEigeneQ]             = useState('');
  const [suche, setSuche]                 = useState('');
  const [collapsed, setCollapsed]         = useState({});
  const [docGespeichert, setDocGespeichert] = useState(false);
  const [diagnose, setDiagnose]           = useState('');
  const [diagnoseSent, setDiagnoseSent]   = useState(false);

  if (['finishing', 'summary', 'done'].includes(state.phase)) {
    return (
      <ZusammenfassungsAnsicht
        state={state}
        api={api}
        docGespeichert={docGespeichert}
        setDocGespeichert={setDocGespeichert}
        navigate={navigate}
      />
    );
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
      : eigeneQ.trim() ? { text: eigeneQ.trim(), category: 'Eigene Frage', type: 'text' } : null;
    if (!q) return;
    post('/api/question', q);
    setAusgewaehlteQ(null);
    setEigeneQ('');
  }

  function diagnoseSenden() {
    if (!diagnose.trim()) return;
    post('/api/diagnosis', { text: diagnose.trim() });
    setDiagnoseSent(true);
  }

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
              <div className="patient-avatar">MH</div>
              <div>
                <div className="patient-name">Maria Hoffmann</div>
                <div className="patient-meta">68 J. · Zimmer 204 · PAT-00482</div>
              </div>
              <span className={`status-badge ${cls}`}>{label}</span>
              <span className="reason-badge">{KATEGORIE[state.patientCategory]}</span>
            </div>
          </>
        )}

        {!hatPatient && (
          <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
            Warte auf Patienten-Eincheck…
          </div>
        )}

        <div className="header-actions">
          <button
            className="btn-header btn-call"
            onClick={() => post('/api/call-patient')}
            disabled={!kannPatientAufrufen}
          >
            Patient aufrufen
          </button>

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
                  <span style={{ marginLeft: 'auto' }}>{collapsed[kat.category] ? '›' : '›'}</span>
                </button>

                {!collapsed[kat.category] && kat.items.map(q => (
                  <button
                    key={q.id}
                    className={`question-item ${ausgewaehlteQ?.id === q.id ? 'selected' : ''}`}
                    onClick={() => { setAusgewaehlteQ(q); setEigeneQ(''); }}
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
          </div>

          <div className="interaction-body">
            {ausgewaehlteQ && (
              <div className="preview-card">
                <div className="preview-label">VORSCHAU · BEREIT ZUM SENDEN</div>
                <span className="preview-cat">{ausgewaehlteQ.category} · {TYPE_LABELS[ausgewaehlteQ.type]}</span>
                <div className="preview-text">{ausgewaehlteQ.text}</div>
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

            {diagnoseSent && state.diagnosis && (
              <div className="diagnosis-sent">
                <strong>Arzt-Mitteilung gesendet:</strong> {state.diagnosis}
              </div>
            )}

            {!ausgewaehlteQ && !state.currentQuestion && (
              <div className="empty-state">
                <div className="empty-icon">→</div>
                <div className="empty-title">Frage aus der Bibliothek wählen</div>
                <div className="empty-sub">
                  {state.phase === 'waiting'
                    ? 'Rufen Sie zuerst den Patienten auf.'
                    : state.phase === 'consultation'
                      ? 'Wählen Sie links eine Frage oder tippen Sie unten.'
                      : 'Warten Sie, bis der Patient eingecheckt hat.'}
                </div>
              </div>
            )}
          </div>

          {/* Diagnose / Arzt-Mitteilung */}
          {kannFrageSenden && (
            <div className="diagnosis-area">
              <div className="diagnosis-label">
                DIAGNOSE / ABSCHLIESSENDE MITTEILUNG
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--yellow-600)' }}>
                  · Patient muss nicht antworten
                </span>
              </div>
              {!diagnoseSent ? (
                <>
                  <div className="diagnosis-row">
                    <textarea
                      className="diagnosis-textarea"
                      placeholder="Diagnose oder abschließende Aussage eingeben…"
                      value={diagnose}
                      onChange={e => setDiagnose(e.target.value)}
                      rows={2}
                    />
                    <button
                      className="btn-diagnosis"
                      onClick={diagnoseSenden}
                      disabled={!diagnose.trim()}
                    >
                      Senden
                    </button>
                  </div>
                  <div className="diagnosis-hint">Diese Nachricht wird dem Patienten angezeigt, erfordert aber keine Antwort.</div>
                </>
              ) : (
                <div className="diagnosis-sent">
                  Mitteilung gesendet. <button style={{ background:'none', border:'none', color:'var(--yellow-700)', cursor:'pointer', textDecoration:'underline', fontSize:12 }} onClick={() => setDiagnoseSent(false)}>Neue Mitteilung</button>
                </div>
              )}
            </div>
          )}

          {/* Eigene Frage */}
          <div className="custom-q-area">
            <div className="custom-q-label">EIGENE FRAGE</div>
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

// ── Zusammenfassungs-Ansicht ────────────────────────────────────────────────
function ZusammenfassungsAnsicht({ state, docGespeichert, setDocGespeichert, navigate }) {
  const qaPaare = getQAPaare(state.conversation);
  const kategorie = KATEGORIE[state.patientCategory] ?? state.patientCategory ?? '–';
  const datum  = new Date().toLocaleDateString('de-DE');
  const uhrzeit = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const urgentCount    = 0;
  const attentionCount = 0;

  return (
    <div className="summary-screen">
      <div className="summary-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <div>
            <div className="summary-header-title">Konsultationszusammenfassung</div>
            <div className="summary-header-sub">
              {state.phase === 'finishing' && 'Warte auf Patientenbestätigung…'}
              {state.phase === 'summary'   && 'Patient prüft die Zusammenfassung…'}
              {state.phase === 'done'      && 'Konsultation abgeschlossen'}
            </div>
          </div>
        </div>
        <div className="summary-header-actions">
          <button className="btn-print" onClick={() => window.print()}>Drucken (Patient)</button>
          <button className="btn-print-primary" onClick={() => window.print()}>Drucken (Arzt)</button>
          <button className="btn-doc" onClick={() => setDocGespeichert(true)}>
            {docGespeichert ? 'Gespeichert' : 'In Dokumentation'}
          </button>
          <button className="btn-new" onClick={() => { post('/api/reset'); navigate('/doctor'); }}>
            Neue Konsultation
          </button>
        </div>
      </div>

      <div className="summary-content">
        {state.phase === 'finishing' && (
          <div className="waiting-patient-confirm">
            Warte darauf, dass der Patient die Zusammenfassungsanfrage beantwortet…
          </div>
        )}

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

          <div className="report-title-row">
            <div className="report-generated">Erstellt am {datum}, {uhrzeit}</div>
          </div>

          <div className="report-patient-row">
            <div><div className="report-field-label">PATIENT</div><div className="report-field-value">Maria Hoffmann</div></div>
            <div><div className="report-field-label">ALTER / ID</div><div className="report-field-value">68 J. · PAT-00482</div></div>
            <div><div className="report-field-label">ZIMMER</div><div className="report-field-value">204</div></div>
            <div><div className="report-field-label">DAUER</div><div className="report-field-value">~{qaPaare.length * 2 + 2} min</div></div>
          </div>

          {/* Diagnose / Arzt-Mitteilung */}
          {state.diagnosis && (
            <div className="report-section">
              <div className="report-section-title">Diagnose / Arzt-Mitteilung</div>
              <div className="diagnosis-report">
                <div className="diagnosis-report-label">ABSCHLIESSENDE AUSSAGE DES ARZTES</div>
                <div className="diagnosis-report-text">{state.diagnosis}</div>
              </div>
            </div>
          )}

          <div className="report-section">
            <div className="report-section-title">Hauptbeschwerde</div>
            <div style={{ fontSize: 13, color: 'var(--gray-700)' }}>
              Patient kommt wegen eines <strong>{kategorie.toLowerCase()}</strong>-bezogenen Anliegens.
            </div>
          </div>

          {qaPaare.length > 0 && (
            <div className="report-section">
              <div className="report-section-title">Strukturierte Anamnese</div>
              {qaPaare.map((p, i) => (
                <div key={i} className="qa-item">
                  <span className="qa-check">✓</span>
                  <span className="qa-q">{p.q}</span>
                  <span className="qa-arrow">→</span>
                  <span className="qa-a">{p.a}</span>
                </div>
              ))}
            </div>
          )}

          <div className="report-section">
            <div className="report-section-title">Befunde</div>
            <div className="findings-row">
              <div className="finding-box urgent">
                <div className="finding-number">{urgentCount}</div>
                <div className="finding-label">DRINGEND</div>
              </div>
              <div className="finding-box attention">
                <div className="finding-number">{attentionCount}</div>
                <div className="finding-label">BEOBACHTEN</div>
              </div>
              <div className="finding-box whl">
                <div className="finding-number">{qaPaare.length}</div>
                <div className="finding-label">BESPROCHEN</div>
              </div>
            </div>
          </div>

          <div className="report-section">
            <div className="report-section-title">Weiteres Vorgehen</div>
            <div className="plan-item"><div className="plan-dot" />Weitere Diagnostik bei Bedarf.</div>
            <div className="plan-item"><div className="plan-dot" />Patientenaufklärung erfolgt über ClearConnect-Tablet.</div>
            <div className="plan-item"><div className="plan-dot" />Wiedervorstellung nach Bedarf.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
