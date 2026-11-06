// Hilfsfunktionen für alle API-Anfragen ans Backend.

// Backend-Adresse: gleicher Rechner, von dem die Seite geladen wurde, Port 3001.
// Am Laptop ergibt das localhost, am iPad automatisch die IP des Laptops.
// Mit REACT_APP_API_URL (z. B. in frontend/.env.local) lässt sich das überschreiben.
export const API =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

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
