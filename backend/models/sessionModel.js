const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/sessions.json');

// Ensure data directory and file exist
function ensureDataFile() {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// Read all sessions
function readSessions() {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

// Write sessions to file
function writeSessions(sessions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Session Model
class Session {
  constructor(data) {
    this.id = data.id || generateId();
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.startTime = data.startTime || new Date().toISOString();
    this.endTime = data.endTime || null;
    this.status = data.status || 'scheduled';
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

module.exports = {
  Session,
  readSessions,
  writeSessions,
  generateId,
  ensureDataFile,
};

