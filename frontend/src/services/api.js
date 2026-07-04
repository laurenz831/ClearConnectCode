// Hilfsfunktionen für alle API-Anfragen ans Backend.

const API = 'http://localhost:3001';

export async function post(endpoint, body = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function get(endpoint) {
  const res = await fetch(`${API}${endpoint}`);
  return res.json();
}
