const aiService = require('./aiService');
const logger = require('../utils/logger');

/**
 * Normalize medication string for comparison
 */
function normalizeMedication(med) {
  return med
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(\d+)\s*mg/g, '$1mg')
    .replace(/(\d+)\s*mcg/g, '$1mcg')
    .trim();
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function similarity(a, b) {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return 1.0;

  const matrix = Array.from({ length: lb.length + 1 }, (_, i) =>
    Array.from({ length: la.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= lb.length; i++) {
    for (let j = 1; j <= la.length; j++) {
      if (lb[i - 1] === la[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
      }
    }
  }

  const maxLen = Math.max(la.length, lb.length);
  return maxLen === 0 ? 1 : 1 - matrix[lb.length][la.length] / maxLen;
}

/**
 * Detect duplicate records across sources
 */
function detectDuplicates(sources) {
  const duplicates = [];

  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const sim = similarity(
        normalizeMedication(sources[i].medication),
        normalizeMedication(sources[j].medication)
      );

      if (sim > 0.85) {
        duplicates.push({
          source_a: sources[i].system,
          source_b: sources[j].system,
          similarity_score: Math.round(sim * 100) / 100,
          medication_a: sources[i].medication,
          medication_b: sources[j].medication,
          likely_duplicate: sim > 0.95,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Calculate preliminary confidence based on source agreement
 */
function calculateSourceAgreement(sources) {
  const normalized = sources.map((s) => normalizeMedication(s.medication));
  const counts = {};

  normalized.forEach((med) => {
    counts[med] = (counts[med] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(counts));
  const agreementRatio = maxCount / sources.length;

  const reliabilityWeights = { high: 3, medium: 2, low: 1 };
  const totalWeight = sources.reduce(
    (sum, s) => sum + (reliabilityWeights[s.source_reliability] || 1),
    0
  );

  return {
    agreement_ratio: Math.round(agreementRatio * 100) / 100,
    total_sources: sources.length,
    agreeing_sources: maxCount,
    weighted_reliability: totalWeight / sources.length,
  };
}

/**
 * Main reconciliation logic
 */
async function reconcile(patientContext, sources) {
  logger.info(`Starting reconciliation for ${sources.length} sources`);

  // Pre-processing
  const duplicates = detectDuplicates(sources);
  const sourceAgreement = calculateSourceAgreement(sources);

  // Get AI reconciliation
  const aiResult = await aiService.reconcileMedication(patientContext, sources);

  // Augment with duplicate detection and agreement metrics
  return {
    ...aiResult,
    meta: {
      sources_analyzed: sources.length,
      duplicate_records: duplicates,
      source_agreement: sourceAgreement,
      processed_at: new Date().toISOString(),
    },
  };
}

module.exports = { reconcile, detectDuplicates, calculateSourceAgreement, normalizeMedication, similarity };