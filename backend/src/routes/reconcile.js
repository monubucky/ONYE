const express = require('express');
const router = express.Router();
const reconciliationService = require('../services/reconciliationService');
const aiService = require('../services/aiService');
const { validateReconcile, validateDataQuality } = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// In-memory store for approved/rejected decisions
const decisions = new Map();

/**
 * POST /api/reconcile/medication
 * Reconcile conflicting medication records
 */
router.post('/medication', validateReconcile, async (req, res, next) => {
  try {
    const { patient_context, sources } = req.body;
    const requestId = uuidv4();

    logger.info(`Reconciliation request ${requestId}: ${sources.length} sources`);

    const result = await reconciliationService.reconcile(patient_context, sources);

    res.json({
      request_id: requestId,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/validate/data-quality
 * Validate patient record data quality
 */
router.post('/validate/data-quality', validateDataQuality, async (req, res, next) => {
  try {
    const requestId = uuidv4();
    logger.info(`Data quality validation request ${requestId}`);

    const result = await aiService.validateDataQuality(req.body);

    res.json({
      request_id: requestId,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reconcile/decision/:requestId
 * Record clinician's approve/reject decision on a reconciliation
 */
router.post('/decision/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { decision, clinician_notes, override_medication } = req.body;

  if (!['approved', 'rejected', 'modified'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be approved, rejected, or modified' });
  }

  const record = {
    request_id: requestId,
    decision,
    clinician_notes: clinician_notes || null,
    override_medication: override_medication || null,
    decided_at: new Date().toISOString(),
  };

  decisions.set(requestId, record);
  logger.info(`Decision recorded for ${requestId}: ${decision}`);

  res.json({ success: true, ...record });
});

/**
 * GET /api/reconcile/decisions
 * Get all recorded decisions
 */
router.get('/decisions', (req, res) => {
  const allDecisions = Array.from(decisions.values());
  res.json({
    total: allDecisions.length,
    decisions: allDecisions,
  });
});

module.exports = router;
