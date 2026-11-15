import { describe, it, expect } from 'vitest';
import { comparisonService } from '../src/services/comparison/comparisonService.js';
import mongoose from 'mongoose';

describe('ComparisonService Unit Tests', () => {
  const olderReport: any = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Baseline Health Checkup',
    reportDate: new Date('2025-01-15'),
  };

  const newerReport: any = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Follow-up Comprehensive Panel',
    reportDate: new Date('2025-07-20'),
  };

  it('correctly matches equivalent test names and calculates differences', () => {
    const olderMeasurements: any[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'Fasting Blood Sugar',
        rawValue: '110 mg/dL',
        numericValue: 110,
        unit: 'mg/dL',
        referenceRangeText: '70 - 99 mg/dL',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'Total Cholesterol',
        rawValue: '220 mg/dL',
        numericValue: 220,
        unit: 'mg/dL',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'Serum Creatinine',
        rawValue: '1.0 mg/dL',
        numericValue: 1.0,
        unit: 'mg/dL',
      },
    ];

    const newerMeasurements: any[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'FBS (Fasting Glucose)',
        rawValue: '95 mg/dL',
        numericValue: 95,
        unit: 'mg/dL',
        referenceRangeText: '70 - 99 mg/dL',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'Serum Cholesterol Total',
        rawValue: '190 mg/dL',
        numericValue: 190,
        unit: 'mg/dL',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'Creatinine',
        rawValue: '1.2 mg/dL',
        numericValue: 1.2,
        unit: 'mg/dL',
      },
    ];

    const result = comparisonService.compareReports(
      olderReport,
      olderMeasurements,
      newerReport,
      newerMeasurements
    );

    expect(result.matchedMeasurements).toHaveLength(3);

    // Glucose: 110 -> 95 = -15 (-13.6%)
    const glucoseMatch = result.matchedMeasurements.find((m) =>
      m.testName.toLowerCase().includes('glucose') || m.testName.toLowerCase().includes('sugar')
    );
    expect(glucoseMatch).toBeDefined();
    expect(glucoseMatch?.direction).toBe('decreased');
    expect(glucoseMatch?.changeAbsolute).toBe(-15);
    expect(glucoseMatch?.changePercentage).toBeCloseTo(-13.6, 1);

    // Cholesterol: 220 -> 190 = -30
    const cholMatch = result.matchedMeasurements.find((m) =>
      m.testName.toLowerCase().includes('cholesterol')
    );
    expect(cholMatch?.direction).toBe('decreased');
    expect(cholMatch?.changeAbsolute).toBe(-30);

    // Creatinine: 1.0 -> 1.2 = +0.2
    const creatMatch = result.matchedMeasurements.find((m) =>
      m.testName.toLowerCase().includes('creatinine')
    );
    expect(creatMatch?.direction).toBe('increased');
    expect(creatMatch?.changeAbsolute).toBe(0.2);

    expect(result.summary).toContain('Comparison between "Baseline Health Checkup"');
  });

  it('handles non-numeric results without crashing', () => {
    const older: any[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'Urine Protein',
        rawValue: 'Negative',
        numericValue: null,
      },
    ];
    const newer: any[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        testName: 'Urine Protein',
        rawValue: 'Trace',
        numericValue: null,
      },
    ];

    const result = comparisonService.compareReports(olderReport, older, newerReport, newer);
    expect(result.matchedMeasurements).toHaveLength(1);
    expect(result.matchedMeasurements[0].comparisonStatus).toBe('non_numeric');
    expect(result.matchedMeasurements[0].direction).toBe('incomparable');
  });
});
