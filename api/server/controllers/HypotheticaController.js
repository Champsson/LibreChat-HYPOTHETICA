const { logger } = require('@librechat/data-schemas');
const {
  orchestrateStart,
  orchestrateTurn,
  getTopic,
  getPersona,
  pickRandomTopic,
} = require('@librechat/api');

/**
 * POST /api/hypothetica/start
 * Start a new Hypothetica conversation
 *
 * Body:
 * - mode: 'observer' | 'participant' | 'duel'
 * - topicId?: string (optional, random if not provided)
 * - userText?: string (for participant/duel modes)
 * - brightPersonaId?: string (optional)
 * - darkPersonaId?: string (optional)
 */
async function start(req, res) {
  try {
    const { mode, topicId, userText, brightPersonaId, darkPersonaId } = req.body;

    // Validate mode
    if (!mode || !['observer', 'participant', 'duel'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode. Must be observer, participant, or duel'
      });
    }

    // Get or pick topic
    const topic = topicId ? getTopic(topicId) : pickRandomTopic();
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get personas if specified
    const brightPersona = brightPersonaId ? getPersona(brightPersonaId) : undefined;
    const darkPersona = darkPersonaId ? getPersona(darkPersonaId) : undefined;

    // Validate personas if provided
    if (brightPersonaId && !brightPersona) {
      return res.status(404).json({ error: 'Bright persona not found' });
    }
    if (darkPersonaId && !darkPersona) {
      return res.status(404).json({ error: 'Dark persona not found' });
    }

    // Call orchestrator
    const result = await orchestrateStart({
      mode,
      topic,
      userText,
      brightPersona,
      darkPersona,
    });

    // Return result with topic info
    res.status(200).json({
      topic: {
        id: topic.id,
        summary: topic.summary,
        alignment: topic.alignment,
      },
      messages: result.messages,
      usingProviders: result.usingProviders,
      mode,
    });
  } catch (error) {
    logger.error('[HypotheticaController.start] Error:', error);
    res.status(500).json({
      error: 'Failed to start Hypothetica conversation',
      message: error.message,
    });
  }
}

/**
 * POST /api/hypothetica/turn
 * Continue a Hypothetica conversation
 *
 * Body:
 * - mode: 'observer' | 'participant' | 'duel'
 * - topicId: string
 * - history: Message[] (previous messages)
 * - userText?: string (for participant/duel modes)
 * - brightPersonaId?: string
 * - darkPersonaId?: string
 */
async function turn(req, res) {
  try {
    const { mode, topicId, history, userText, brightPersonaId, darkPersonaId } = req.body;

    // Validate inputs
    if (!mode || !['observer', 'participant', 'duel'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode. Must be observer, participant, or duel'
      });
    }

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: 'history is required and must be non-empty' });
    }

    // Get topic
    const topic = getTopic(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get personas if specified
    const brightPersona = brightPersonaId ? getPersona(brightPersonaId) : undefined;
    const darkPersona = darkPersonaId ? getPersona(darkPersonaId) : undefined;

    // Call orchestrator
    const result = await orchestrateTurn({
      mode,
      topic,
      history,
      userText,
      brightPersona,
      darkPersona,
    });

    // Return result
    res.status(200).json({
      messages: result.messages,
      usingProviders: result.usingProviders,
    });
  } catch (error) {
    logger.error('[HypotheticaController.turn] Error:', error);
    res.status(500).json({
      error: 'Failed to continue Hypothetica conversation',
      message: error.message,
    });
  }
}

/**
 * GET /api/hypothetica/topics
 * Get all available topics
 */
async function listTopics(req, res) {
  try {
    const { TOPIC_LIBRARY } = require('@librechat/api');

    res.status(200).json({
      topics: TOPIC_LIBRARY.map(t => ({
        id: t.id,
        summary: t.summary,
        alignment: t.alignment,
      })),
    });
  } catch (error) {
    logger.error('[HypotheticaController.listTopics] Error:', error);
    res.status(500).json({
      error: 'Failed to list topics',
      message: error.message,
    });
  }
}

/**
 * GET /api/hypothetica/personas
 * Get all available personas
 */
async function listPersonas(req, res) {
  try {
    const { PERSONAS } = require('@librechat/api');

    res.status(200).json({
      personas: PERSONAS.map(p => ({
        id: p.id,
        name: p.name,
        alignment: p.alignment,
        seed: p.seed,
      })),
    });
  } catch (error) {
    logger.error('[HypotheticaController.listPersonas] Error:', error);
    res.status(500).json({
      error: 'Failed to list personas',
      message: error.message,
    });
  }
}

module.exports = {
  start,
  turn,
  listTopics,
  listPersonas,
};
