# Clear Connect

Eine Plattform, die Patienten mit Fachleuten im Gesundheitswesen verbindet.

## Projektstruktur

```
clear-connect/
├── frontend/          # React-Anwendung
│   └── src/
│       ├── components/
│       │   ├── Patient/
│       │   ├── Doctor/
│       │   └── Common/
│       ├── pages/
│       ├── services/
│       ├── data/
│       ├── App.js
│       └── index.js
│
└── backend/           # Node.js/Express Server
    ├── routes/
    ├── controllers/
    ├── models/
    └── server.js
```

## Installation

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
npm install
npm start
```

## Umgebungsvariablen

Keine externe Datenbank nötig! Daten werden lokal in `backend/data/sessions.json` gespeichert.

## Technologie-Stack

- **Frontend**: React, JavaScript
- **Backend**: Node.js, Express
- **Datenspeicherung**: JSON-Dateien (lokal)

## Lizenz

MIT
