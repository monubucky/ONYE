process.env.API_SECRET_KEY = 'test-secret-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

// Mock AI service to avoid real API calls in tests
jest.mock('../src/services/aiService', () => ({
  reconcileMedication: jest.fn().mockResolvedValue({
    reconciled_medication: 'Metformin 500mg twice daily',
    confidence_score: 0.88,
    reasoning: 'Primary care record is most recent.',
    recommended_actions: ['Update Hospital EHR'],
    clinical_safety_check: 'PASSED',
    source_weights: {
      most_reliable: 'Primary Care',
      least_reliable: 'Pharmacy',
      explanation: 'Primary care has most recent update',
    },
    conflict_type: 'dose_discrepancy',
  }),
  validateDataQuality: jest.fn().mockResolvedValue({
    overall_score: 62,
    breakdown: {
      completeness: 60,
      accuracy: 50,
      timeliness: 70,
      clinical_plausibility: 40,
    },
    issues_detected: [
      { field: 'vital_signs.blood_pressure', issue: 'Implausible BP', severity: 'high' },
    ],
    summary: 'Record has quality issues requiring review.',
    requires_immediate_review: true,
  }),
}));

const VALID_HEADERS = { 'X-API-Key': 'test-secret-key' };

const VALID_RECONCILE_BODY = {
  patient_context: {
    age: 67,
    conditions: ['Type 2 Diabetes'],
    recent_labs: { eGFR: 45 },
  },
  sources: [
    {
      system: 'Hospital EHR',
      medication: 'Metformin 1000mg twice daily',
      last_updated: '2024-10-15',
      source_reliability: 'high',
    },
    {
      system: 'Primary Care',
      medication: 'Metformin 500mg twice daily',
      last_updated: '2025-01-20',
      source_reliability: 'high',
    },
  ],
};

describe('Health Check', () => {
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('Authentication', () => {
  test('returns 401 without API key', async () => {
    const res = await request(app).post('/api/reconcile/medication').send(VALID_RECONCILE_BODY);
    expect(res.status).toBe(401);
  });

  test('returns 403 with wrong API key', async () => {
    const res = await request(app)
      .post('/api/reconcile/medication')
      .set('X-API-Key', 'wrong-key')
      .send(VALID_RECONCILE_BODY);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/reconcile/medication', () => {
  test('returns reconciliation result with valid input', async () => {
    const res = await request(app)
      .post('/api/reconcile/medication')
      .set(VALID_HEADERS)
      .send(VALID_RECONCILE_BODY);

    expect(res.status).toBe(200);
    expect(res.body.reconciled_medication).toBeDefined();
    expect(res.body.confidence_score).toBeDefined();
    expect(res.body.reasoning).toBeDefined();
    expect(res.body.request_id).toBeDefined();
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.sources_analyzed).toBe(2);
  });

  test('returns 400 with only one source', async () => {
    const body = { ...VALID_RECONCILE_BODY, sources: [VALID_RECONCILE_BODY.sources[0]] };
    const res = await request(app)
      .post('/api/reconcile/medication')
      .set(VALID_HEADERS)
      .send(body);
    expect(res.status).toBe(400);
  });

  test('returns 400 with missing patient_context', async () => {
    const { patient_context, ...body } = VALID_RECONCILE_BODY;
    const res = await request(app)
      .post('/api/reconcile/medication')
      .set(VALID_HEADERS)
      .send(body);
    expect(res.status).toBe(400);
  });

  test('returns 400 with invalid source_reliability', async () => {
    const body = {
      ...VALID_RECONCILE_BODY,
      sources: [
        { ...VALID_RECONCILE_BODY.sources[0], source_reliability: 'excellent' },
        VALID_RECONCILE_BODY.sources[1],
      ],
    };
    const res = await request(app)
      .post('/api/reconcile/medication')
      .set(VALID_HEADERS)
      .send(body);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/validate/data-quality', () => {
  test('returns quality score with valid input', async () => {
    const res = await request(app)
      .post('/api/validate/data-quality')
      .set(VALID_HEADERS)
      .send({
        demographics: { name: 'John Doe', dob: '1955-03-15', gender: 'M' },
        medications: ['Metformin 500mg'],
        vital_signs: { blood_pressure: '340/180' },
      });

    expect(res.status).toBe(200);
    expect(res.body.overall_score).toBeDefined();
    expect(res.body.breakdown).toBeDefined();
    expect(res.body.issues_detected).toBeDefined();
  });

  test('returns 400 with empty body', async () => {
    const res = await request(app)
      .post('/api/validate/data-quality')
      .set(VALID_HEADERS)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/reconcile/decision/:requestId', () => {
  test('records approved decision', async () => {
    const res = await request(app)
      .post('/api/reconcile/decision/test-request-123')
      .set(VALID_HEADERS)
      .send({ decision: 'approved', clinician_notes: 'Looks correct' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.decision).toBe('approved');
  });

  test('returns 400 for invalid decision', async () => {
    const res = await request(app)
      .post('/api/reconcile/decision/test-request-123')
      .set(VALID_HEADERS)
      .send({ decision: 'maybe' });
    expect(res.status).toBe(400);
  });
});
