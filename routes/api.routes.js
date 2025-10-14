// routes/api.routes.js

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller');

// Health check
router.get('/health', apiController.getHealth);

// Initialize session
router.post('/initialize', apiController.initialize);

// Manually set JWT token
router.post('/client-set-token', apiController.setToken);

// Get states, districts, courts, etc.
router.get('/states', apiController.getStates);
router.post('/districts', apiController.getDistricts);
router.post('/courts', apiController.getCourts);
router.post('/establishments', apiController.getEstablishments);
router.post('/case-types', apiController.getCaseTypes);

// Search routes
router.post('/search/case-number', apiController.searchByCaseNumber);
router.post('/search/cnr', apiController.searchByCnr);

// Case details
router.post('/case-history', apiController.getCaseHistory);
router.post('/cause-list', apiController.getCauseList);

module.exports = router;