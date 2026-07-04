const { Session, readSessions, writeSessions } = require('../models/sessionModel');

// Create a new session
exports.createSession = (req, res) => {
  try {
    const sessions = readSessions();
    const newSession = new Session(req.body);
    sessions.push(newSession);
    writeSessions(sessions);
    res.status(201).json(newSession);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get session by ID
exports.getSession = (req, res) => {
  try {
    const sessions = readSessions();
    const session = sessions.find(s => s.id === req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all sessions
exports.getAllSessions = (req, res) => {
  try {
    const sessions = readSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update session
exports.updateSession = (req, res) => {
  try {
    const sessions = readSessions();
    const index = sessions.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const updatedSession = {
      ...sessions[index],
      ...req.body,
      id: sessions[index].id,
      createdAt: sessions[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    sessions[index] = updatedSession;
    writeSessions(sessions);
    res.json(updatedSession);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete session
exports.deleteSession = (req, res) => {
  try {
    const sessions = readSessions();
    const filteredSessions = sessions.filter(s => s.id !== req.params.id);
    if (filteredSessions.length === sessions.length) {
      return res.status(404).json({ error: 'Session not found' });
    }
    writeSessions(filteredSessions);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

