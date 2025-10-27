const express = require('express');
const router = express.Router();
const HypotheticaController = require('../controllers/HypotheticaController');
const { requireJwtAuth } = require('../middleware/');

// All Hypothetica routes require authentication
router.use(requireJwtAuth);

/**
 * POST /api/hypothetica/start
 * Start a new Hypothetica conversation
 */
router.post('/start', HypotheticaController.start);

/**
 * POST /api/hypothetica/turn
 * Continue a Hypothetica conversation
 */
router.post('/turn', HypotheticaController.turn);

/**
 * GET /api/hypothetica/topics
 * List all available topics
 */
router.get('/topics', HypotheticaController.listTopics);

/**
 * GET /api/hypothetica/personas
 * List all available personas
 */
router.get('/personas', HypotheticaController.listPersonas);

module.exports = router;
