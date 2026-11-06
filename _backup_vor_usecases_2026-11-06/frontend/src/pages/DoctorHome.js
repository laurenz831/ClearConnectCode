import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../services/api';

const KATEGORIE = {
  pain:       'Schmerzen',
  checkup:    'Vorsorge',
  medication: 'Medikamente',
  other:      'Sonstiges',
};

// Beispiel-Patienten für den Homescreen (Demo)
const DEMO_PATIENTS = [
  { id: 1, name: 'Maria Hoffmann',  initials: 'MH', age: 68, room: '204', category: 'pain',       time: '09:15', date: 'heute',      questions: 8, status: 'done' },
  { id: 2, name: 'Thomas Brandt',   initials: 'TB', age: 54, room: '107', category: 'checkup',    time: '08:30', date: 'heute',      questions: 5, status: 'done' },
  { id: 3, name: 'Erika Müller',    initials: 'EM', age: 72, room: '312', category: 'medication', time: '14:00', date: 'gestern',    questions: 6, status: 'done' },
  { id: 4, name: 'Klaus Schneider', initials: 'KS', age: 61, room: '205', category: 'pain',       time: '11:20', date: 'gestern',    questions: 9, status: 'done' },
  { id: 5, name: 'Anna Fischer',    initials: 'AF', age: 45, room: '109', category: 'other',      time: '10:45', date: '28.05.2026', questions: 4, status: 'done' },
  { id: 6, name: 'Werner Koch',     initials: 'WK', age: 79, room: '308', category: 'checkup',    time: '09:00', date: '27.05.2026', questions: 7, status: 'done' },
];

// Mini-Kalender-Komponente
function MiniCalendar() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today.getDate());

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

  return (
    <div className="mini-calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{monthNames[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {dayNames.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`cal-day ${d === null ? 'empty' : ''} ${d && isToday(d) ? 'today' : ''} ${d === selected ? 'selected' : ''}`}
            onClick={() => d && setSelected(d)}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DoctorHome({ state, api }) {
  const navigate = useNavigate();
  const isActive = ['waiting','called','consultation','finishing','summary','done'].includes(state.phase) && state.phase !== 'welcome';

  const statsToday = DEMO_PATIENTS.filter(p => p.date === 'heute').length;
  const statsTotal = DEMO_PATIENTS.length;

  function goToSession() {
    navigate('/doctor/session');
  }

  function startNew() {
    post('/api/reset').then(() => navigate('/doctor/session'));
  }

  return (
    <div className="doctor-home">
      {/* Header */}
      <header className="home-header">
        <div className="home-logo">
          <div className="home-logo-mark">CC</div>
          <div className="home-logo-text">
            <h1>ClearConnect</h1>
            <span>Arzt-Portal</span>
          </div>
        </div>
        <div className="home-header-right">
          <span className="doctor-chip">Dr. A. Schultz · Innere Medizin</span>
          <button className="btn-new-session" onClick={startNew}>
            + Neue Konsultation
          </button>
        </div>
      </header>

      <div className="home-body">
        {/* Statistiken */}
        <div className="home-stats">
          <div className="stat-card">
            <div className="stat-number">{statsToday}</div>
            <div className="stat-label">Konsultationen heute</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-number">{statsTotal}</div>
            <div className="stat-label">Diese Woche</div>
          </div>
          <div className="stat-card green">
            <div className="stat-number">3</div>
            <div className="stat-label">Abgeschlossen heute</div>
          </div>
          <div className="stat-card red">
            <div className="stat-number">{isActive ? 1 : 0}</div>
            <div className="stat-label">Aktive Sitzung</div>
          </div>
        </div>

        <div className="home-sections">
          {/* Linke Spalte */}
          <div>
            {/* Aktive Sitzung */}
            {isActive && (
              <div style={{ marginBottom: 24 }}>
                <div className="section-card">
                  <div className="section-title">
                    Laufende Konsultation
                    <span className="section-title-badge" style={{ background: '#dcfce7', color: '#15803d' }}>Aktiv</span>
                  </div>
                  <div
                    className="active-session-card"
                    onClick={goToSession}
                  >
                    <div className="active-tag">LAUFEND</div>
                    <div className="active-patient">Maria Hoffmann</div>
                    <div className="active-meta">68 J. · Zimmer 204 · {KATEGORIE[state.patientCategory] ?? 'Eincheck läuft…'}</div>
                    <button className="active-btn" onClick={e => { e.stopPropagation(); goToSession(); }}>
                      Zur Konsultation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Verlauf */}
            <div className="section-card">
              <div className="section-title">
                Vergangene Konsultationen
                <span className="section-title-badge">{statsTotal} Einträge</span>
              </div>
              <div className="session-list">
                {DEMO_PATIENTS.map(p => (
                  <div key={p.id} className="session-item">
                    <div className="session-avatar">{p.initials}</div>
                    <div className="session-info">
                      <div className="session-name">{p.name}</div>
                      <div className="session-meta">{p.age} J. · Zimmer {p.room} · {p.questions} Fragen</div>
                    </div>
                    <span className={`session-tag ${p.category}`}>{KATEGORIE[p.category]}</span>
                    <div className="session-time">{p.date}<br />{p.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rechte Spalte */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="section-card">
              <div className="section-title">Kalender</div>
              <MiniCalendar />
            </div>

            <div className="section-card">
              <div className="section-title">Schnellstart</div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={startNew}
                  style={{
                    padding: '12px 16px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  + Neue Konsultation starten
                </button>
                <button
                  onClick={() => window.open('/patient', '_blank')}
                  style={{
                    padding: '12px 16px', background: '#fffbeb', border: '2px solid #fde68a',
                    color: '#b45309', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  Patienten-Tablet öffnen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
