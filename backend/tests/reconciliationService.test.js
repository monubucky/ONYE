const {
  detectDuplicates,
  calculateSourceAgreement,
  normalizeMedication,
  similarity,
} = require('../src/services/reconciliationService');

describe('normalizeMedication', () => {
  test('normalizes whitespace and case', () => {
    expect(normalizeMedication('Metformin  500mg')).toBe('metformin 500mg');
    expect(normalizeMedication('ASPIRIN 81MG')).toBe('aspirin 81mg');
  });

  test('normalizes space between number and unit', () => {
    expect(normalizeMedication('Metformin 500 mg twice daily')).toBe('metformin 500mg twice daily');
    expect(normalizeMedication('Lisinopril 10 mg')).toBe('lisinopril 10mg');
  });

  test('handles already normalized input', () => {
    expect(normalizeMedication('metformin 500mg')).toBe('metformin 500mg');
  });
});

describe('similarity', () => {
  test('identical strings have similarity 1.0', () => {
    expect(similarity('aspirin 81mg', 'aspirin 81mg')).toBe(1.0);
  });

  test('completely different strings have low similarity', () => {
    expect(similarity('aspirin 81mg', 'metformin 500mg')).toBeLessThanOrEqual(0.4);
  });

  test('similar strings have high similarity', () => {
    // 'aspirin 81mg daily' vs 'aspirin 81mg' — suffix difference, still >60%
    expect(similarity('aspirin 81mg daily', 'aspirin 81mg')).toBeGreaterThan(0.6);
  });

  test('empty strings', () => {
    expect(similarity('', '')).toBe(1);
  });
});

describe('detectDuplicates', () => {
  test('detects near-duplicate medication records', () => {
    const sources = [
      { system: 'Hospital A', medication: 'Metformin 500mg twice daily', source_reliability: 'high' },
      { system: 'Clinic B',   medication: 'Metformin 500mg twice daily', source_reliability: 'high' },
      { system: 'Pharmacy',   medication: 'Lisinopril 10mg', source_reliability: 'medium' },
    ];

    const dupes = detectDuplicates(sources);
    expect(dupes.length).toBeGreaterThanOrEqual(1);
    expect(dupes[0].source_a).toBe('Hospital A');
    expect(dupes[0].source_b).toBe('Clinic B');
    expect(dupes[0].similarity_score).toBeGreaterThan(0.85);
  });

  test('returns empty array when no duplicates', () => {
    const sources = [
      { system: 'Hospital A', medication: 'Aspirin 81mg', source_reliability: 'high' },
      { system: 'Clinic B', medication: 'Metformin 500mg', source_reliability: 'high' },
      { system: 'Pharmacy', medication: 'Lisinopril 10mg', source_reliability: 'medium' },
    ];

    const dupes = detectDuplicates(sources);
    expect(dupes.length).toBe(0);
  });

  test('handles single source', () => {
    const sources = [
      { system: 'Hospital A', medication: 'Aspirin 81mg', source_reliability: 'high' },
    ];
    const dupes = detectDuplicates(sources);
    expect(dupes.length).toBe(0);
  });
});

describe('calculateSourceAgreement', () => {
  test('100% agreement when all sources agree', () => {
    const sources = [
      { system: 'A', medication: 'Aspirin 81mg daily', source_reliability: 'high' },
      { system: 'B', medication: 'Aspirin 81mg daily', source_reliability: 'high' },
    ];
    const result = calculateSourceAgreement(sources);
    expect(result.agreement_ratio).toBe(1.0);
    expect(result.agreeing_sources).toBe(2);
  });

  test('partial agreement calculation', () => {
    const sources = [
      { system: 'A', medication: 'Aspirin 81mg', source_reliability: 'high' },
      { system: 'B', medication: 'Aspirin 81mg', source_reliability: 'high' },
      { system: 'C', medication: 'Aspirin 325mg', source_reliability: 'medium' },
    ];
    const result = calculateSourceAgreement(sources);
    expect(result.agreement_ratio).toBeCloseTo(0.67, 1);
    expect(result.total_sources).toBe(3);
  });

  test('includes weighted reliability score', () => {
    const sources = [
      { system: 'A', medication: 'Aspirin 81mg', source_reliability: 'high' },
      { system: 'B', medication: 'Aspirin 325mg', source_reliability: 'low' },
    ];
    const result = calculateSourceAgreement(sources);
    expect(result.weighted_reliability).toBeDefined();
    expect(result.weighted_reliability).toBeGreaterThan(0);
  });

  test('handles unknown reliability', () => {
    const sources = [
      { system: 'A', medication: 'Aspirin 81mg' },
      { system: 'B', medication: 'Aspirin 81mg' },
    ];
    const result = calculateSourceAgreement(sources);
    expect(result.weighted_reliability).toBe(1); // default weight 1
  });
});
