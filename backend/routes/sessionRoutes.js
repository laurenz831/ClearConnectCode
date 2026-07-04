const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Routes for session management
router.post('/create', sessionController.createSession);
router.get('/:id', sessionController.getSession);
router.put('/:id', sessionController.updateSession);
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
