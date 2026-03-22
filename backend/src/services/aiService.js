const https = require('https');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

const OPENROUTER_HOST = 'openrouter.ai';

// Fallback hardcoded list — used only if model discovery fails
const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'openchat/openchat-7b:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'gryphe/mythomist-7b:free',
  'undi95/toppy-m-7b:free',
];

let discoveredModels = null; // cached after first discovery
let workingModel = null;

/* ─── HTTP helpers ─────────────────────────────────────── */

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(parsed?.error?.message || JSON.stringify(parsed).slice(0, 200));
            err.status = res.statusCode;
            err.body = parsed;
            return reject(err);
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Bad response (${res.statusCode}): ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/* ─── Discover free models from OpenRouter ────────────── */

async function discoverFreeModels() {
  if (discoveredModels) return discoveredModels;

  try {
    const result = await httpsRequest({
      hostname: OPENROUTER_HOST,
      path: '/api/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    const free = (result.data || [])
      .filter(m => m.id.endsWith(':free'))
      .map(m => m.id);

    if (free.length > 0) {
      logger.info(`Discovered ${free.length} free models: ${free.slice(0, 5).join(', ')}...`);
      discoveredModels = free;
      return free;
    }
  } catch (err) {
    logger.warn(`Model discovery failed: ${err.message}. Using fallback list.`);
  }

  discoveredModels = FALLBACK_MODELS;
  return FALLBACK_MODELS;
}

/* ─── Call a single model ─────────────────────────────── */

function openRouterPost(model, messages) {
  const body = JSON.stringify({
    model,
    messages,
    temperature: 0.1,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  });

  return httpsRequest(
    {
      hostname: OPENROUTER_HOST,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'EHR Reconciliation Engine',
      },
    },
    body
  );
}

function extractJSON(result, model) {
  const text = result?.choices?.[0]?.message?.content || '';
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  if (!clean) throw new Error(`${model} returned empty response`);
  try {
    return JSON.parse(clean);
  } catch {
    logger.warn(`${model} returned non-JSON, skipping. Got: ${clean.slice(0, 120)}`);
    // Throw a non-SyntaxError so the caller skips to the next model
    const err = new Error(`${model} returned non-JSON output`);
    err.status = 0; // treated as skippable
    throw err;
  }
}

/* ─── Main call with auto-discovery + retry ───────────── */

async function callAI(systemPrompt, userPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt + '\n\nCRITICAL: Your response must be a single valid JSON object. No markdown, no code fences, no explanation — only the raw JSON.' },
    { role: 'user', content: userPrompt },
  ];

  // Fast path
  if (workingModel) {
    try {
      const result = await openRouterPost(workingModel, messages);
      return extractJSON(result, workingModel);
    } catch (err) {
      if (err instanceof SyntaxError) throw err;
      logger.warn(`Cached model ${workingModel} failed (${err.status}), re-discovering...`);
      workingModel = null;
      discoveredModels = null; // force re-discovery
    }
  }

  const models = await discoverFreeModels();
  const rateLimited = [];

  // Pass 1: try all models
  for (const model of models) {
    try {
      logger.debug(`Trying: ${model}`);
      const result = await openRouterPost(model, messages);
      const parsed = extractJSON(result, model);
      workingModel = model;
      logger.info(`✓ Working model: ${model}`);
      return parsed;
    } catch (err) {
      if (err.status === 429) {
        rateLimited.push(model);
        logger.debug(`${model} rate limited, will retry...`);
      } else {
        logger.debug(`${model} skipped (${err.status || err.message?.slice(0,60)})`);
      }
    }
  }

  // Pass 2: retry rate-limited models after a pause
  if (rateLimited.length > 0) {
    logger.info(`Waiting 8s before retrying ${rateLimited.length} rate-limited model(s)...`);
    await new Promise(r => setTimeout(r, 8000));

    for (const model of rateLimited) {
      try {
        logger.debug(`Retrying: ${model}`);
        const result = await openRouterPost(model, messages);
        const parsed = extractJSON(result, model);
        workingModel = model;
        logger.info(`✓ Working model (retry): ${model}`);
        return parsed;
      } catch (err) {
        logger.debug(`${model} still unavailable (${err.status || err.message?.slice(0,60)})`);
      }
    }
  }

  const err = new Error(
    'No free AI models are available right now. ' +
    'Please wait 1-2 minutes and try again. ' +
    'Free tier models have shared rate limits.'
  );
  err.statusCode = 503;
  throw err;
}

/* ─────────────────────────────────────────
   MEDICATION RECONCILIATION
───────────────────────────────────────── */

async function reconcileMedication(patientContext, sources) {
  const cacheKey = cacheService.generateCacheKey('reconcile', { patientContext, sources });
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const result = await callAI(
    `You are a clinical pharmacist AI specializing in medication reconciliation. \
Analyze conflicting medication records from multiple healthcare systems and determine the most \
clinically accurate information. Always respond with valid JSON matching the exact schema — no markdown.`,
    buildReconciliationPrompt(patientContext, sources)
  );

  cacheService.set(cacheKey, result);
  return result;
}

function buildReconciliationPrompt(patientContext, sources) {
  const sourceList = sources
    .map((s, i) => `Source ${i + 1} — ${s.system}:
  medication: "${s.medication}"
  last_updated/filled: ${s.last_updated || s.last_filled || 'unknown'}
  reliability: ${s.source_reliability || 'unknown'}`)
    .join('\n\n');

  return `Analyze these conflicting medication records and determine the most clinically accurate information.

PATIENT CONTEXT:
  age: ${patientContext.age ?? 'unknown'}
  conditions: ${(patientContext.conditions || []).join(', ') || 'none listed'}
  recent_labs: ${JSON.stringify(patientContext.recent_labs || {})}

CONFLICTING SOURCES:
${sourceList}

RECONCILIATION PRIORITY RULES (apply in order):
1. More recent records from high-reliability sources take precedence
2. Pharmacy fill records reflect actual dispensing — strong real-world evidence
3. Primary care records reflect the active prescription
4. Clinical context (labs, conditions) may indicate a dose adjustment is warranted
5. Patient portal data is self-reported — treat as least reliable

Respond with ONLY this JSON (no markdown):
{
  "reconciled_medication": "<drug name, dose, frequency>",
  "confidence_score": <0.0-1.0>,
  "reasoning": "<2-4 sentence clinical explanation>",
  "recommended_actions": ["<action 1>", "<action 2>"],
  "clinical_safety_check": "<PASSED|REVIEW_NEEDED|FAILED>",
  "source_weights": {
    "most_reliable": "<system name>",
    "least_reliable": "<system name>",
    "explanation": "<one sentence>"
  },
  "conflict_type": "<dose_discrepancy|drug_discrepancy|status_discrepancy|frequency_discrepancy>"
}`;
}

/* ─────────────────────────────────────────
   DATA QUALITY VALIDATION
───────────────────────────────────────── */

async function validateDataQuality(patientRecord) {
  const cacheKey = cacheService.generateCacheKey('validate', patientRecord);
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const result = await callAI(
    `You are a clinical data quality analyst. Evaluate patient health records for \
completeness, accuracy, timeliness, and clinical plausibility. \
Always respond with valid JSON matching the exact schema — no markdown.`,
    buildValidationPrompt(patientRecord)
  );

  cacheService.set(cacheKey, result);
  return result;
}

function buildValidationPrompt(record) {
  return `Evaluate this patient health record for data quality across four dimensions.

PATIENT RECORD:
${JSON.stringify(record, null, 2)}

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

SCORING GUIDE (0-100 per dimension):
- completeness: Are all critical fields present? Empty allergies = likely incomplete (-10).
- accuracy: Clinically plausible values? BP > 300 systolic = implausible (-30). HR < 20 or > 300 = implausible (-30).
- timeliness: Data age. > 6 months = medium concern (-15). > 12 months = high concern (-30).
- clinical_plausibility: Do medications, conditions, and vitals form a coherent clinical picture?

Respond with ONLY this JSON (no markdown):
{
  "overall_score": <weighted average 0-100>,
  "breakdown": {
    "completeness": <0-100>,
    "accuracy": <0-100>,
    "timeliness": <0-100>,
    "clinical_plausibility": <0-100>
  },
  "issues_detected": [
    { "field": "<field.path>", "issue": "<description>", "severity": "<low|medium|high>" }
  ],
  "summary": "<one sentence overall assessment>",
  "requires_immediate_review": <true|false>
}`;
}

module.exports = { reconcileMedication, validateDataQuality };