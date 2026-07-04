import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DoctorHome from './pages/DoctorHome';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientFlow from './pages/PatientFlow';
import './App.css';

const API = 'http://localhost:3001';

export default function App() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch(`${API}/api/state`);
        const data = await res.json();
        if (active) { setState(data); setError(false); }
      } catch {
        if (active) setError(true);
      }
    }
    poll();
    const interval = setInterval(poll, 1000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (error) {
    return (
      <div className="connection-error">
        <div className="error-card">
          <div className="error-icon">!</div>
          <h2>Backend nicht erreichbar</h2>
          <p>Starte das Backend in einem Terminal:</p>
          <code>cd backend &amp;&amp; npm run dev</code>
          <p className="error-hint">Server muss auf Port 3001 laufen.</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="connection-error">
        <div className="error-card">
          <div className="spinner" />
          <p>Verbinde mit Server…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/doctor" replace />} />
        <Route path="/doctor" element={<DoctorHome state={state} api={API} />} />
        <Route path="/doctor/session" element={<DoctorDashboard state={state} api={API} />} />
        <Route path="/patient" element={<PatientFlow state={state} api={API} />} />
      </Routes>
    </BrowserRouter>
  );
}
