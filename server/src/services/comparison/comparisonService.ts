import { IExtractedMeasurement } from '../../models/ExtractedMeasurement.js';
import { IMedicalReport } from '../../models/MedicalReport.js';
import { IMatchedMeasurement } from '../../models/ReportComparison.js';

interface UnitConversionRule {
  standardUnit: string;
  conversions: Record<string, (val: number) => number>;
}

// Clinically validated unit conversions
const KNOWN_UNIT_CONVERSIONS: Record<string, UnitConversionRule> = {
  glucose: {
    standardUnit: 'mg/dL',
    conversions: {
      'mmol/L': (val) => val * 18.0182,
      'mg/dL': (val) => val,
    },
  },
  cholesterol: {
    standardUnit: 'mg/dL',
    conversions: {
      'mmol/L': (val) => val * 38.67,
      'mg/dL': (val) => val,
    },
  },
  creatinine: {
    standardUnit: 'mg/dL',
    conversions: {
      'umol/L': (val) => val / 88.4,
      'µmol/L': (val) => val / 88.4,
      'mg/dL': (val) => val,
    },
  },
};

export class ComparisonService {
  private normalizeTestName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private areTestsEquivalent(name1: string, name2: string): boolean {
    const n1 = this.normalizeTestName(name1);
    const n2 = this.normalizeTestName(name2);

    if (n1 === n2) return true;

    // Known medical aliases
    const aliases: string[][] = [
      ['fbs', 'fasting blood sugar', 'fasting blood glucose', 'fasting plasma glucose', 'glucose fasting'],
      ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'a1c'],
      ['total cholesterol', 'cholesterol total', 'serum cholesterol'],
      ['hdl', 'hdl cholesterol', 'high density lipoprotein'],
      ['ldl', 'ldl cholesterol', 'low density lipoprotein'],
      ['serum creatinine', 'creatinine', 'blood creatinine'],
      ['tsh', 'thyroid stimulating hormone', 'ultrasensitive tsh'],
      ['hemoglobin', 'hb', 'hgb'],
      ['platelet count', 'platelets', 'plt'],
      ['total leukocytes count', 'wbc', 'white blood cell count', 'tlc'],
    ];

    for (const group of aliases) {
      const match1 = group.some((alias) => n1.includes(alias) || alias.includes(n1));
      const match2 = group.some((alias) => n2.includes(alias) || alias.includes(n2));
      if (match1 && match2) return true;
    }

    return false;
  }

  compareReports(
    olderReport: IMedicalReport,
    olderMeasurements: IExtractedMeasurement[],
    newerReport: IMedicalReport,
    newerMeasurements: IExtractedMeasurement[]
  ): {
    matchedMeasurements: IMatchedMeasurement[];
    summary: string;
  } {
    const matched: IMatchedMeasurement[] = [];
    const usedNewerIds = new Set<string>();

    for (const olderM of olderMeasurements) {
      const match = newerMeasurements.find(
        (nm) =>
          !usedNewerIds.has(nm._id.toString()) &&
          this.areTestsEquivalent(olderM.testName, nm.testName)
      );

      if (!match) continue;
      usedNewerIds.add(match._id.toString());

      const olderVal = olderM.numericValue;
      const newerVal = match.numericValue;

      let normalizedOlder = olderVal;
      let normalizedNewer = newerVal;
      let targetUnit = olderM.unit || match.unit || null;
      let status: IMatchedMeasurement['comparisonStatus'] = 'comparable';

      // Check if both have numeric values
      if (olderVal === null || newerVal === null || olderVal === undefined || newerVal === undefined) {
        status = 'non_numeric';
        matched.push({
          testName: olderM.testName,
          olderValue: {
            raw: olderM.rawValue,
            numeric: null,
            unit: olderM.unit,
            date: olderReport.reportDate || olderReport.createdAt,
          },
          newerValue: {
            raw: match.rawValue,
            numeric: null,
            unit: match.unit,
            date: newerReport.reportDate || newerReport.createdAt,
          },
          normalizedUnit: null,
          changeAbsolute: null,
          changePercentage: null,
          direction: 'incomparable',
          comparisonStatus: 'non_numeric',
          referenceRange: match.referenceRangeText || olderM.referenceRangeText,
        });
        continue;
      }

      // Check for unit mismatch
      const u1 = (olderM.unit || '').trim().toLowerCase();
      const u2 = (match.unit || '').trim().toLowerCase();

      if (u1 !== u2 && u1 && u2) {
        // Look up unit conversions
        let conversionFound = false;
        for (const [key, rule] of Object.entries(KNOWN_UNIT_CONVERSIONS)) {
          if (
            olderM.testName.toLowerCase().includes(key) &&
            rule.conversions[u1] &&
            rule.conversions[u2]
          ) {
            normalizedOlder = rule.conversions[u1](olderVal);
            normalizedNewer = rule.conversions[u2](newerVal);
            targetUnit = rule.standardUnit;
            conversionFound = true;
            break;
          }
        }

        if (!conversionFound) {
          status = 'unit_mismatch_unconvertible';
          matched.push({
            testName: olderM.testName,
            olderValue: {
              raw: olderM.rawValue,
              numeric: olderVal,
              unit: olderM.unit,
              date: olderReport.reportDate || olderReport.createdAt,
            },
            newerValue: {
              raw: match.rawValue,
              numeric: newerVal,
              unit: match.unit,
              date: newerReport.reportDate || newerReport.createdAt,
            },
            normalizedUnit: null,
            changeAbsolute: null,
            changePercentage: null,
            direction: 'incomparable',
            comparisonStatus: 'unit_mismatch_unconvertible',
            referenceRange: match.referenceRangeText || olderM.referenceRangeText,
          });
          continue;
        }
      }

      // Calculate change
      const diff = Math.round((normalizedNewer! - normalizedOlder!) * 100) / 100;
      let pctChange: number | null = null;
      if (normalizedOlder !== 0) {
        pctChange = Math.round(((normalizedNewer! - normalizedOlder!) / Math.abs(normalizedOlder!)) * 1000) / 10;
      }

      let direction: IMatchedMeasurement['direction'] = 'unchanged';
      if (diff > 0.001) direction = 'increased';
      else if (diff < -0.001) direction = 'decreased';

      matched.push({
        testName: olderM.testName,
        olderValue: {
          raw: olderM.rawValue,
          numeric: olderVal,
          unit: olderM.unit,
          date: olderReport.reportDate || olderReport.createdAt,
        },
        newerValue: {
          raw: match.rawValue,
          numeric: newerVal,
          unit: match.unit,
          date: newerReport.reportDate || newerReport.createdAt,
        },
        normalizedUnit: targetUnit,
        changeAbsolute: diff,
        changePercentage: pctChange,
        direction,
        comparisonStatus: 'comparable',
        referenceRange: match.referenceRangeText || olderM.referenceRangeText,
      });
    }

    // Generate grounded 3-4 lines summary
    const comparableCount = matched.filter((m) => m.comparisonStatus === 'comparable').length;
    const increased = matched.filter((m) => m.direction === 'increased').map((m) => m.testName);
    const decreased = matched.filter((m) => m.direction === 'decreased').map((m) => m.testName);

    const olderDateStr = olderReport.reportDate
      ? new Date(olderReport.reportDate).toLocaleDateString()
      : 'earlier date';
    const newerDateStr = newerReport.reportDate
      ? new Date(newerReport.reportDate).toLocaleDateString()
      : 'recent date';

    let summary = `Comparison between "${olderReport.title}" (${olderDateStr}) and "${newerReport.title}" (${newerDateStr}) identified ${matched.length} common test parameters (${comparableCount} numerically comparable).\n`;
    if (matched.length === 0) {
      summary =
        `These two reports did not share comparable extracted measurements. Only tests that appear in both reports, with compatible units, can be compared. Missing values were not invented.\n` +
        summary;
    }

    if (increased.length > 0) {
      summary += `Parameters showing higher values on the newer report: ${increased.slice(0, 3).join(', ')}${increased.length > 3 ? ` and ${increased.length - 3} others` : ''}.\n`;
    }
    if (decreased.length > 0) {
      summary += `Parameters showing lower values on the newer report: ${decreased.slice(0, 3).join(', ')}${decreased.length > 3 ? ` and ${decreased.length - 3} others` : ''}.\n`;
    }
    summary += `A numerical increase or decrease is not automatically improvement or worsening. Discuss trends with a licensed clinician.`;

    return {
      matchedMeasurements: matched,
      summary,
    };
  }
}

export const comparisonService = new ComparisonService();
