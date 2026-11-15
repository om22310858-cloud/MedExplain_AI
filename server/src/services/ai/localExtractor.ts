/**
 * Local PDF Text Measurement Extractor
 *
 * Parses structured laboratory measurements from plain text extracted from a PDF,
 * without requiring an external AI API.
 *
 * Strategy: regex-based pattern matching for common lab-report formats.
 * Only extracts values actually present in the text. Never invents values.
 * Returns an empty measurements array (not an error) if no patterns match.
 */

import { logger } from '../../utils/logger.js';

export interface LocalMeasurement {
  testName: string;
  originalTestName: string;
  rawValue: string;
  numericValue: number | null;
  unit: string | null;
  referenceRangeText: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  resultFlag: 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
  sourcePage: number;
}

export interface PatientDemographics {
  patientName?: string | null;
  patientGender?: string | null;
  patientAge?: number | null;
  patientDob?: string | null;
  specimenDate?: string | null;
  physicianName?: string | null;
  laboratoryName?: string | null;
}

export interface LocalExtractionResult {
  measurements: LocalMeasurement[];
  demographics?: PatientDemographics;
  extractedSummary: string;
  warnings: string[];
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Known test name aliases → canonical name
// ---------------------------------------------------------------------------
const TEST_NAME_ALIASES: Array<[RegExp, string]> = [
  // Glucose & Glycemic Markers
  [/fasting\s*(plasma\s*)?glucose|glucose\s*fasting|fasting\s*blood\s*(sugar|glucose)|fbg|fps|fpg|fbs/i, 'Fasting Blood Glucose'],
  [/post[\s-]?prandial|ppbs|2[\s-]?hr?\s*glucose|2[\s-]?hour|glucose\s*post[\s-]?prandial/i, 'Post-Prandial Blood Glucose'],
  [/random\s*(blood\s*)?(sugar|glucose)|rbg|rbs/i, 'Random Blood Glucose'],
  [/oral\s*glucose\s*tolerance|ogtt/i, 'OGTT Glucose'],
  [/c[\s-]?peptide/i, 'C-Peptide'],
  [/fructosamine/i, 'Fructosamine'],
  // HbA1c
  [/hba1c|glycat(ed|ed)\s*h(a?e)?moglobin|glycosylated|hb\s*a1c|a1c/i, 'HbA1c'],
  [/estimated\s*average\s*glucose|\beag\b/i, 'Estimated Average Glucose'],
  // CBC
  [/h(a?e)?moglobin(?!\s*a1c)|\bhgb\b|\bhb\b/i, 'Haemoglobin'],
  [/(total\s*)?r(ed\s*)?b(lood\s*)?c(ell)?(\s*count)?|\brbc\b/i, 'RBC Count'],
  [/(white\s*blood\s*cell|w\.?b\.?c\.?|total\s*leuk|tlc|t\.?l\.?c\.?)(\s*count)?/i, 'WBC Count'],
  [/platelet(\s*count)?|\bplt\b|\bthrombocyte/i, 'Platelet Count'],
  [/haematocrit|hematocrit|\bpcv\b|\bhct\b/i, 'Haematocrit'],
  [/\bmcv\b/i, 'MCV'],
  [/\bmchc\b/i, 'MCHC'],
  [/\bmch\b/i, 'MCH'],
  [/neutrophil/i, 'Neutrophils'],
  [/lymphocyte/i, 'Lymphocytes'],
  [/eosinophil/i, 'Eosinophils'],
  [/monocyte/i, 'Monocytes'],
  [/basophil/i, 'Basophils'],
  // Thyroid
  [/t\.?s\.?h\.?|thyroid\s*stimulat/i, 'TSH'],
  [/free\s*t3|ft3|free\s*tri/i, 'Free T3'],
  [/free\s*t4|ft4|free\s*thyrox/i, 'Free T4'],
  [/total\s*t3/i, 'Total T3'],
  [/total\s*t4/i, 'Total T4'],
  // Lipids & Cardiovascular
  [/total\s*cholesterol|serum\s*cholesterol|cholesterol[,\s]+total/i, 'Total Cholesterol'],
  [/hdl(\s*cholesterol)?|hdl\s*cholesterol[,\s]+direct/i, 'HDL Cholesterol'],
  [/ldl(\s*cholesterol)?|ldl\s*cholesterol[,\s]+direct/i, 'LDL Cholesterol'],
  [/triglyceride/i, 'Triglycerides'],
  [/vldl/i, 'VLDL Cholesterol'],
  [/apolipoprotein\s*b|\bapo[\s-]?b\b/i, 'Apolipoprotein B'],
  [/apolipoprotein\s*a1?|\bapo[\s-]?a1?\b/i, 'Apolipoprotein A1'],
  [/lipoprotein\s*\(?a\)?|\blp\(a\)\b/i, 'Lipoprotein (a)'],
  // Cardiac Markers
  [/troponin(\s*i)?|\bhs[\s-]?c?tni\b/i, 'Troponin I'],
  [/\bck[\s-]?mb\b|creatine\s*kinase[\s-]?mb/i, 'CK-MB'],
  [/\bnt[\s-]?probnp\b|\bbnp\b|brain\s*natriuretic/i, 'NT-proBNP'],
  // Kidney & Proteins
  [/microalbumin[\s/]+creatinine\s*(ratio)?|\buacr\b/i, 'Urine Albumin/Creatinine Ratio'],
  [/serum\s*creatinine|blood\s*creatinine|\bcreatinine\b/i, 'Serum Creatinine'],
  [/blood\s*urea\s*nitrogen|urea\s*nitrogen|\bbun\b/i, 'Blood Urea Nitrogen'],
  [/serum\s*urea|\burea\b/i, 'Serum Urea'],
  [/uric\s*acid/i, 'Uric Acid'],
  [/\begfr\b|estimated.*gfr/i, 'eGFR'],
  [/\balbumin\b/i, 'Albumin'],
  [/total\s*protein/i, 'Total Protein'],
  [/\bsodium\b|\bna\b/i, 'Sodium'],
  [/\bpotassium\b|\bk\b/i, 'Potassium'],
  [/\bcreatinine\s*clearance\b/i, 'Creatinine Clearance'],
  // Coagulation
  [/\binr\b|international\s*normalized/i, 'INR'],
  [/prothrombin\s*time|\bpt\b/i, 'Prothrombin Time'],
  [/a\.?p\.?t\.?t\.?|activated\s*partial/i, 'aPTT'],
  [/d[\s-]?dimer/i, 'D-Dimer'],
  [/\bfibrinogen\b/i, 'Fibrinogen'],
  // Inflammation
  [/\bhs[\s-]?crp\b|high[\s-]sensitivity\s*crp|c[\s-]?reactive\s*protein|\bcrp\b/i, 'C-Reactive Protein'],
  [/\besr\b|erythrocyte\s*sedimentation/i, 'ESR'],
  [/homocysteine/i, 'Homocysteine'],
  // Hormones & Reproductive (PCOS/Endocrine)
  [/lh\s*\(day\s*\d+\)|luteiniz(ing|ation)\s*hormone|\blh\b/i, 'LH'],
  [/fsh\s*\(day\s*\d+\)|follicle\s*stimulating\s*hormone|\bfsh\b/i, 'FSH'],
  [/lh[\s/]+fsh\s*ratio/i, 'LH/FSH Ratio'],
  [/total\s*testosterone|\btestosterone\b/i, 'Total Testosterone'],
  [/free\s*androgen\s*index|\bfai\b/i, 'Free Androgen Index'],
  [/anti[\s-]?mullerian\s*hormone|\bamh\b/i, 'Anti-Mullerian Hormone (AMH)'],
  [/\bprolactin\b/i, 'Prolactin'],
  [/fasting\s*insulin|\binsulin\b/i, 'Fasting Insulin'],
  [/\bhoma[\s-]?ir\b/i, 'HOMA-IR'],
  [/vitamin\s*d(\s*\(25[\s-]oh\))?|25[\s-]hydroxy\s*vitamin\s*d|\bvit\s*d\b/i, 'Vitamin D (25-OH)'],
];

// Common units — ordered longest-first to avoid partial matches
const UNIT_PATTERNS = [
  // Concentration
  'g/dL', 'g/L', 'mg/dL', 'mg/L', 'mmol/L', 'µmol/L', 'umol/L', 'nmol/L', 'pmol/L',
  'mIU/mL', 'µIU/mL', 'uIU/mL', 'uIU/ml', 'IU/mL', 'U/L', 'U/l', 'U/mL',
  'ng/dL', 'ng/mL', 'pg/mL', 'µg/L', 'µg/mL', 'ug/mL', 'ug/ml FEU', 'ug/ml', 'FEU',
  'mEq/L', 'meq/L',
  // Blood counts
  'x10^3/µL', 'x10^3/uL', 'x10³/µL', '×10³/µL', '10^3/µL', '10^3/uL',
  'x10^6/µL', 'x10^6/uL', 'x10⁶/µL', '10^6/µL', '10^6/uL',
  'million/µL', 'million/uL', 'million/mm3', 'lakh/µL', 'lakh/uL',
  'cells/µL', 'cells/uL', 'cells/mm3',
  // Time
  'seconds', 'secs', 'sec', 's',
  // Volume
  'fL', 'fl',
  // Mass per unit
  'pg',
  // Misc
  '%',
  'mm/hr', 'mm/h',
  'mL/min/1.73m2', 'mL/min/1.73m²',
  'mg/g',
  'index',
  'ratio',
];

// Build a single regex for unit matching (order matters: longer first)
const UNIT_REGEX_SRC = UNIT_PATTERNS
  .sort((a, b) => b.length - a.length)
  .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

// Determine result flag from value vs range (supports both two-sided and one-sided thresholds)
function flagFromRange(
  value: number,
  low: number | null,
  high: number | null
): 'normal' | 'high' | 'low' | 'unknown' {
  if (low === null && high === null) return 'unknown';
  if (low !== null && value < low) return 'low';
  if (high !== null && value > high) return 'high';
  return 'normal';
}

// Parse a reference range string like "12.0 - 16.0" or "70-99" or "< 5.7" or "Above 40"
function parseRange(text: string): { low: number | null; high: number | null } {
  // Pattern: number - number
  const dashMatch = text.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  if (dashMatch) {
    return { low: parseFloat(dashMatch[1]), high: parseFloat(dashMatch[2]) };
  }
  // Pattern: < number or below number
  const ltMatch = text.match(/(?:below|<|less\s*than)\s*(\d+\.?\d*)/i);
  if (ltMatch) {
    return { low: null, high: parseFloat(ltMatch[1]) };
  }
  // Pattern: > number or above number
  const gtMatch = text.match(/(?:above|>|greater\s*than)\s*(\d+\.?\d*)/i);
  if (gtMatch) {
    return { low: parseFloat(gtMatch[1]), high: null };
  }
  return { low: null, high: null };
}

// Normalize test name using our alias table
function canonicalName(rawName: string): string | null {
  for (const [pattern, canonical] of TEST_NAME_ALIASES) {
    if (pattern.test(rawName)) return canonical;
  }
  return null;
}

export function extractDemographicsFromText(text: string): PatientDemographics {
  let patientName: string | null = null;
  let patientGender: string | null = null;
  let patientAge: number | null = null;
  let patientDob: string | null = null;
  let specimenDate: string | null = null;
  let physicianName: string | null = null;
  let laboratoryName: string | null = null;

  // Patient Name: "Patient Name: ...", "Patient: ...", "Name: ..."
  const nameMatch = text.match(/(?:Patient(?:\s*Name)?|Name)\s*:\s*([^\r\n]+?)(?=\s*(?:Gender|Sex|Age|DOB|Date of Birth|Patient\s*ID|MRN)\s*:|$|\r?\n)/i);
  if (nameMatch) {
    const clean = nameMatch[1].trim().replace(/\s+/g, ' ');
    if (clean.length > 1 && !/^(male|female|unknown|na|n\/a)$/i.test(clean)) {
      patientName = clean;
    }
  }

  // Gender: "Gender: Female", "Sex: M", "Gender: Male"
  const genderMatch = text.match(/(?:Gender|Sex)\s*:\s*(Female|Male|F|M|Other)/i);
  if (genderMatch) {
    const g = genderMatch[1].toUpperCase();
    patientGender = (g === 'F' || g === 'FEMALE') ? 'Female' : (g === 'M' || g === 'MALE') ? 'Male' : 'Other';
  }

  // DOB: "Date of Birth: 01.01.1973" or "DOB: 12/05/1985"
  const dobMatch = text.match(/(?:Date\s*of\s*Birth|DOB|D\.O\.B\.)\s*:\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i);
  if (dobMatch) {
    patientDob = dobMatch[1];
    const parts = patientDob.split(/[./-]/);
    if (parts.length === 3) {
      let year = parseInt(parts[2], 10);
      if (year < 100) year += year > 30 ? 1900 : 2000;
      const currentYear = new Date().getFullYear();
      if (year > 1900 && year <= currentYear) {
        patientAge = currentYear - year;
      }
    }
  }

  // Direct Age match if not derived from DOB: "Age: 45", "Age: 51 Y", "45 Y / Female"
  if (patientAge === null) {
    const ageMatch = text.match(/(?:Age)\s*[:/]\s*(\d{1,3})\s*(?:Y|Yrs|Years)?/i) ||
                     text.match(/(\d{1,3})\s*(?:Y|Yrs|Years)\s*[/]\s*(?:Male|Female|M|F)/i);
    if (ageMatch) {
      patientAge = parseInt(ageMatch[1], 10);
    }
  }

  // Specimen / Sampling Date: "Sampling Date: 27.04.2019", "Report Date: 28.04.2019"
  const dateMatch = text.match(/(?:Sampling|Collection|Specimen|Receipt|Report)\s*Date\s*(?:\/\s*Time)?\s*:\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i);
  if (dateMatch) {
    specimenDate = dateMatch[1];
  }

  // Physician / Doctor: "Physician: Dr. M. Jaksch", "Doctor: Dr. John"
  const docMatch = text.match(/(?:Physician|Consultant|Doctor|Ref(?:\.|erred)?\s*(?:by|doctor)?)\s*:\s*([^\r\n]+)/i);
  if (docMatch) {
    physicianName = docMatch[1].trim().replace(/\s+/g, ' ');
  }

  // Laboratory Name - search clean line by line
  const textLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const l of textLines) {
    if (!laboratoryName && /(?:Laboratory|Laboratories|Diagnostics|Hospital|Clinic|Medical\s*Lab)/i.test(l)) {
      if (!/(?:physician|dr\.|patient|report\s*date|sampling|techn|supervisor|request)/i.test(l) && l.length > 5 && l.length < 80) {
        laboratoryName = l.replace(/\s+/g, ' ');
        break;
      }
    }
  }

  return { patientName, patientGender, patientAge, patientDob, specimenDate, physicianName, laboratoryName };
}

/**
 * Main extraction function.
 * Parses all lines of extracted PDF text looking for lab test rows.
 */
export function extractMeasurementsFromText(
  text: string,
  _category: string
): LocalExtractionResult {
  const demographics = extractDemographicsFromText(text);
  if (!text || text.trim().length < 10) {
    return {
      measurements: [],
      extractedSummary: 'The document contained insufficient readable text for local extraction.',
      warnings: [],
      limitations: ['Document text is too short to extract laboratory measurements.'],
    };
  }

  const measurements: LocalMeasurement[] = [];
  const seenTests = new Set<string>();
  const lines = text.split(/\r?\n/);
  const limitations: string[] = [];
  const warnings: string[] = [];

  // Pattern to match a lab value row.
  // Handles multiple PDF text formats:
  //   Format A (colon/space separator): "Haemoglobin (Hb): 11.2 g/dL  Ref: 12.0-16.0 g/dL  LOW"
  //   Format B (run-together table): "Fasting plasma glucose108mg/dLCommon screening range..."
  //   Format C (whitespace table):  "HbA1c   5.8   %   ..."
  const patterns = [
    // Format A: explicit separator before number
    new RegExp(
      `^([^:0-9]{2,60}?)[:\\s]+(\\d+\\.?\\d*)\\s*(high|low|abnormal|normal|borderline)?\\s*(${UNIT_REGEX_SRC})(.*)$`,
      'i'
    ),
    // Format B: letters running directly into digits (PDF column concatenation with optional flag before unit)
    new RegExp(
      `^([a-zA-Z][a-zA-Z0-9 ()./,'\\-]{1,59}?)(?:[:\\s]+|(?=\\d))(\\d+\\.?\\d*)\\s*(high|low|abnormal|normal|borderline)?\\s*(${UNIT_REGEX_SRC})(.*)$`,
      'i'
    ),
  ];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line || line.length < 3) continue;

    let match: RegExpMatchArray | null = null;
    let explicitCanonical: string | null = null;

    // Check alias-first to protect test names ending with numbers (e.g. Apolipoprotein A1, Free T3, Free T4)
    for (const [aliasPat, canon] of TEST_NAME_ALIASES) {
      const aliasMatch = line.match(
        new RegExp(
          `^(${aliasPat.source})\\s*(?:[:\\s]+|(?=\\d))(\\d+\\.?\\d*)\\s*(high|low|abnormal|normal|borderline)?\\s*(${UNIT_REGEX_SRC})(.*)$`,
          'i'
        )
      );
      if (aliasMatch) {
        match = aliasMatch;
        explicitCanonical = canon;
        break;
      }
    }

    if (!match) {
      for (const pat of patterns) {
        match = line.match(pat);
        if (match) break;
      }
    }

    if (!match) {
      // Format C: Multi-line / columnar table where test name is on lineIdx
      // and value, flag, units/ranges appear on subsequent lines
      const cleanLine = line.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
      const canonical = canonicalName(line) || canonicalName(cleanLine);
      if (canonical && !seenTests.has(canonical)) {
        let numStr: string | null = null;
        let numericValue: number | null = null;
        let unit: string | null = null;
        let rawFlag: string | null = null;
        let referenceRangeText: string | null = null;

        for (let j = 1; j <= 4 && (lineIdx + j) < lines.length; j++) {
          const next = lines[lineIdx + j].trim();
          if (!next) continue;

          // Check if this line is a number
          if (numStr === null) {
            const numMatch = next.match(/^(\d+\.?\d*)$/);
            if (numMatch) {
              numStr = numMatch[1];
              numericValue = parseFloat(numStr);
              continue;
            }
          }

          // Check if this line is an explicit flag
          if (/^(high|low|abnormal|normal|borderline)$/i.test(next)) {
            rawFlag = next.toLowerCase();
            continue;
          }

          // Check if line contains unit and reference range
          const unitMatch = next.match(new RegExp(`^(${UNIT_REGEX_SRC})(.*)$`, 'i'));
          if (unitMatch && !unit) {
            unit = unitMatch[1].trim();
            const rest = unitMatch[2].trim();
            if (rest) {
              const parsed = parseRange(rest);
              if (parsed.low !== null || parsed.high !== null) {
                referenceRangeText = rest;
              }
            }
            break;
          }
        }

        if (numStr !== null && numericValue !== null && !Number.isNaN(numericValue)) {
          const refLow = referenceRangeText ? parseRange(referenceRangeText).low : null;
          const refHigh = referenceRangeText ? parseRange(referenceRangeText).high : null;
          let resultFlag: LocalMeasurement['resultFlag'] = flagFromRange(numericValue, refLow, refHigh);
          if (resultFlag === 'unknown' && rawFlag) {
            if (rawFlag.includes('high')) resultFlag = 'high';
            else if (rawFlag.includes('low')) resultFlag = 'low';
            else if (rawFlag.includes('normal')) resultFlag = 'normal';
            else resultFlag = 'abnormal';
          }

          seenTests.add(canonical);
          measurements.push({
            testName: canonical,
            originalTestName: line,
            rawValue: unit ? `${numStr} ${unit}` : `${numStr}`,
            numericValue,
            unit: unit || 'units',
            referenceRangeText: referenceRangeText
              ? referenceRangeText + (unit && !referenceRangeText.includes(unit) ? ` ${unit}` : '')
              : null,
            referenceLow: refLow,
            referenceHigh: refHigh,
            resultFlag,
            sourcePage: 1,
          });
          continue;
        }
      }
      continue;
    }

    const rawTestName = (match[1] || '').trim().replace(/\s+/g, ' ');
    const numStr = match[2] || '';
    const embeddedFlag = match[3] ? match[3].toLowerCase() : null;
    const unit = (match[4] || 'units').trim();
    const rest = (match[5] || '').trim();

    const canonical = explicitCanonical || canonicalName(rawTestName);
    if (!canonical) continue; // Unknown test — skip

    // Avoid duplicate test names
    if (seenTests.has(canonical)) continue;

    const numericValue = parseFloat(numStr);
    if (Number.isNaN(numericValue)) continue;

    // Try to extract reference range from "rest"
    let referenceRangeText: string | null = null;
    let referenceLow: number | null = null;
    let referenceHigh: number | null = null;

    // Look for "Ref(erence)?: <range>" or just a bare range at the end
    const refMatch = rest.match(/(?:ref(?:erence)?[:\s]*)([\d.<>\-–\s]+(?:\d))/i);
    if (refMatch) {
      referenceRangeText = refMatch[1].trim();
      const parsed = parseRange(referenceRangeText);
      referenceLow = parsed.low;
      referenceHigh = parsed.high;
    } else {
      // Bare range pattern at end of line: e.g. "12.0 - 16.0" or "< 5.7"
      const bareRange = rest.match(/((?:\d+\.?\d*\s*[-–]\s*\d+\.?\d*)|(?:[<>]\s*\d+\.?\d*))/);
      if (bareRange) {
        referenceRangeText = bareRange[1].trim();
        const parsed = parseRange(referenceRangeText);
        referenceLow = parsed.low;
        referenceHigh = parsed.high;
      }
    }

    // Determine flag
    let resultFlag: LocalMeasurement['resultFlag'] = flagFromRange(numericValue, referenceLow, referenceHigh);
    if (resultFlag === 'unknown') {
      if (embeddedFlag) {
        if (embeddedFlag.includes('high')) resultFlag = 'high';
        else if (embeddedFlag.includes('low')) resultFlag = 'low';
        else if (embeddedFlag.includes('normal')) resultFlag = 'normal';
        else resultFlag = 'abnormal';
      } else {
        // Try explicit HIGH/LOW/NORMAL/ABNORMAL text in the line
        const flagMatch = line.match(/\b(HIGH|LOW|NORMAL|ABNORMAL|ABOVE\s*NORMAL|BELOW\s*NORMAL|BORDERLINE)\b/i);
        if (flagMatch) {
          const f = flagMatch[1].toUpperCase();
          if (f.includes('HIGH') || f.includes('ABOVE')) resultFlag = 'high';
          else if (f.includes('LOW') || f.includes('BELOW')) resultFlag = 'low';
          else if (f.includes('NORMAL')) resultFlag = 'normal';
          else resultFlag = 'abnormal';
        }
      }
    }

    seenTests.add(canonical);
    measurements.push({
      testName: canonical,
      originalTestName: rawTestName,
      rawValue: `${numStr} ${unit}`,
      numericValue,
      unit,
      referenceRangeText: referenceRangeText
        ? referenceRangeText + (unit && !referenceRangeText.includes(unit) ? ` ${unit}` : '')
        : null,
      referenceLow,
      referenceHigh,
      resultFlag,
      sourcePage: 1,
    });
  }

  // Build summary
  const flagged = measurements.filter((m) => m.resultFlag === 'high' || m.resultFlag === 'low');
  const extractedSummary = measurements.length > 0
    ? `Local text extraction identified ${measurements.length} laboratory measurement${measurements.length !== 1 ? 's' : ''} from the document. ` +
      (flagged.length > 0
        ? `${flagged.length} value${flagged.length !== 1 ? 's' : ''} appear outside the printed reference range${flagged.length !== 1 ? 's' : ''} (${flagged.map((m) => m.testName).join(', ')}). `
        : 'All extracted values are within their printed reference ranges. ') +
      'This summary is educational. Values are extracted from the printed document and have not been verified by a clinician.'
    : 'No structured laboratory measurements could be identified in the extracted text. ' +
      'The document may be a prescription, discharge summary, or image-based scan without selectable text.';

  if (measurements.length === 0) {
    limitations.push(
      'No laboratory measurement patterns were recognised. If this is a scanned document without selectable text, AI-based image extraction (requires Gemini API key) would be needed.'
    );
  }

  logger.info(`Local extractor: found ${measurements.length} measurements`);
  return { measurements, demographics, extractedSummary, warnings, limitations };
}

/**
 * Generate simple educational explanations for extracted measurements.
 * These are deterministic and do NOT require an AI API.
 * Returns one explanation per measurement where a known description exists.
 */
export interface LocalExplanation {
  testName: string;
  valueAndUnit: string;
  referenceRange?: string;
  status: 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
  simpleExplanation: string;
  limitationsAndFactors: string;
  clinicianQuestions: string[];
}

const TEST_EXPLANATIONS: Record<string, { explanation: string; factors: string; questions: string[] }> = {
  'Fasting Blood Glucose': {
    explanation: 'Fasting blood glucose is the amount of sugar (glucose) in your blood after not eating for at least 8 hours. Glucose is the main fuel your body uses for energy. The pancreas produces insulin to help cells absorb glucose.',
    factors: 'Stress, illness, very recent exercise, certain medications (steroids, some blood-pressure drugs), and the timing of the last meal can all affect fasting glucose. A single measurement can vary day-to-day.',
    questions: ['Is my fasting glucose result from a capillary (finger-prick) or venous (arm draw) sample?', 'Should I repeat this test on another day to confirm the result?', 'Are any of my current medications known to affect blood sugar?'],
  },
  'Post-Prandial Blood Glucose': {
    explanation: 'Post-prandial blood glucose is the blood sugar level measured 2 hours after a meal. It reflects how effectively your body uses insulin to process the carbohydrates you ate.',
    factors: 'The exact composition of the meal (amount and type of carbohydrates), timing of the blood draw, physical activity after eating, and stress can all influence this reading.',
    questions: ['What meal was consumed before this test?', 'How does this value compare to my fasting result?'],
  },
  'HbA1c': {
    explanation: 'HbA1c (glycated haemoglobin) reflects your average blood glucose level over the past 2-3 months. Glucose attaches to haemoglobin (a protein in red blood cells), and this percentage reflects how much attachment has occurred.',
    factors: 'Anaemia, blood transfusions, certain haemoglobin variants, kidney disease, and some supplements can make HbA1c less reliable. It is an average and does not show daily fluctuations.',
    questions: ['Does my haemoglobin level or any variant affect how accurate this HbA1c reading is?', 'How often should I monitor HbA1c given my current result?'],
  },
  'Haemoglobin': {
    explanation: 'Haemoglobin is the protein inside red blood cells that carries oxygen from your lungs to every part of your body. Low haemoglobin (anaemia) can cause tiredness, breathlessness, and pale skin.',
    factors: 'Iron or vitamin B12/folate deficiency, chronic illness, recent blood loss, high altitude, and dehydration can all affect haemoglobin. Results are slightly different for men, women, and children.',
    questions: ['If my haemoglobin is low, would iron studies or a vitamin B12 and folate test be useful?', 'What might be causing this level given my symptoms?'],
  },
  'WBC Count': {
    explanation: 'White blood cells (WBC) are the cells of your immune system that fight infection and foreign substances. Different types (neutrophils, lymphocytes, etc.) each have specific roles.',
    factors: 'Infection, inflammation, medications (including steroids), physical stress, smoking, and certain medical conditions can raise or lower the WBC count. A mildly abnormal count on its own usually needs context.',
    questions: ['Would a differential count (breakdown by cell type) be helpful to interpret this result?', 'Is this value consistent with my current symptoms?'],
  },
  'Platelet Count': {
    explanation: 'Platelets are tiny cell fragments that help form blood clots and stop bleeding. Very low counts can increase bleeding risk; very high counts can increase clotting risk in some situations.',
    factors: 'Viral infections, certain medications, autoimmune conditions, and bone marrow conditions can affect platelet counts. Many mildly abnormal counts have benign causes.',
    questions: ['Should I avoid aspirin or other blood-thinning substances given this count?', 'Is a peripheral smear review recommended?'],
  },
  'RBC Count': {
    explanation: 'The red blood cell count tells you how many red blood cells are in a unit of blood. Together with haemoglobin and haematocrit, it helps diagnose different types of anaemia and other blood conditions.',
    factors: 'Hydration status, altitude, bone marrow function, nutritional deficiencies, and chronic disease all influence RBC counts.',
    questions: ['How does my RBC count relate to my haemoglobin and haematocrit values?'],
  },
  'Haematocrit': {
    explanation: 'Haematocrit (or PCV — packed cell volume) is the percentage of your blood volume that is made up of red blood cells. It is closely related to haemoglobin and is used to diagnose anaemia or polycythaemia.',
    factors: 'Dehydration can falsely raise haematocrit; fluid overload can lower it. The same conditions that affect haemoglobin also affect haematocrit.',
    questions: ['Is my haematocrit consistent with my haemoglobin and RBC values?'],
  },
  'TSH': {
    explanation: 'TSH (thyroid-stimulating hormone) is produced by the pituitary gland to control thyroid activity. A high TSH often suggests the thyroid is underactive; a low TSH may suggest it is overactive. TSH is typically the first thyroid test ordered.',
    factors: 'Time of day (TSH peaks at night), recent illness, medications (including steroids, amiodarone, lithium, and biotin), pregnancy, and pituitary conditions can all affect TSH levels. Reference ranges vary between laboratories.',
    questions: ['Should Free T4 and/or Free T3 be checked alongside this TSH result?', 'Are any of my medications known to affect thyroid hormone levels?', 'Has this TSH been measured on a specific time of day or after any change in medication?'],
  },
  'Free T4': {
    explanation: 'Free T4 (thyroxine) is the main thyroid hormone in circulation that is not bound to proteins. Together with TSH, it gives a fuller picture of thyroid function.',
    factors: 'Severe illness, protein abnormalities, and certain medications can affect Free T4 levels. Reference ranges differ between different laboratory assays and pregnancy.',
    questions: ['How does my Free T4 level relate to my TSH result?', 'Does my laboratory use the same reference range for pregnancy?'],
  },
  'Free T3': {
    explanation: 'Free T3 (triiodothyronine) is the active form of thyroid hormone. It is usually checked when TSH and Free T4 are abnormal to gain additional information about thyroid status.',
    factors: 'T3 can be low in severe non-thyroid illness even without true thyroid disease. It fluctuates more during the day than T4.',
    questions: ['Is my Free T3 result consistent with my other thyroid values?'],
  },
  'Post-Prandial Blood Glucose': {
    explanation: 'Post-prandial blood glucose measures blood sugar levels exactly 2 hours after the start of a meal. It evaluates how effectively your body produces and uses insulin to clear dietary glucose.',
    factors: 'Meal composition (carbohydrate quantity and glycemic index), physical activity after eating, and medication timing alter post-prandial readings.',
    questions: ['Does my post-meal glucose rise indicate impaired glucose tolerance?', 'Should I monitor my blood sugar before and after specific meals?'],
  },
  'Estimated Average Glucose': {
    explanation: 'Estimated Average Glucose (eAG) translates your HbA1c percentage into the familiar daily mg/dL units used on fingerstick glucose meters over the preceding 2 to 3 months.',
    factors: 'Derived directly from HbA1c using the ADAG formula: eAG (mg/dL) = 28.7 × HbA1c - 46.7.',
    questions: ['How closely does this eAG match my daily home blood glucose meter readings?'],
  },
  'C-Peptide': {
    explanation: 'C-Peptide is created when insulin is produced by the pancreas. Measuring C-peptide shows how much endogenous insulin your body is making on its own.',
    factors: 'Fasting status, kidney clearance, and pancreatic beta-cell function influence circulating C-peptide concentrations.',
    questions: ['What does my C-peptide level reveal about my pancreas beta-cell reserve?'],
  },
  'Fructosamine': {
    explanation: 'Fructosamine reflects average blood glucose control over the past 2 to 3 weeks by measuring glycated serum proteins (mainly albumin).',
    factors: 'Useful when HbA1c is unreliable due to hemoglobin variants, pregnancy, or recent blood loss/transfusions.',
    questions: ['Why was fructosamine measured instead of or in addition to HbA1c?'],
  },
  'Urine Albumin/Creatinine Ratio': {
    explanation: 'UACR detects microscopic leakage of albumin into the urine, serving as the earliest clinical biomarker of diabetic kidney disease and vascular damage.',
    factors: 'Vigorous exercise, fever, urinary tract infection, and acute illness can temporarily elevate urinary albumin excretion.',
    questions: ['Does my UACR result indicate early diabetic kidney involvement?', 'Should kidney-protective medications (like ACE inhibitors or SGLT2 inhibitors) be discussed?'],
  },
  'Apolipoprotein B': {
    explanation: 'ApoB measures the total number of atherogenic (plaque-forming) particles in the blood, including LDL, VLDL, and IDL. It is often a superior predictor of heart disease than LDL alone.',
    factors: 'Metabolic syndrome, high triglycerides, diet, and familial hyperlipidemia elevate ApoB particle counts.',
    questions: ['What does my ApoB particle concentration suggest about my cardiovascular plaque risk?'],
  },
  'Apolipoprotein A1': {
    explanation: 'ApoA1 is the major protein component of protective HDL particles. It helps remove cholesterol from artery walls and return it to the liver.',
    factors: 'Regular aerobic exercise, genetics, liver health, and healthy dietary fats help maintain optimal ApoA1.',
    questions: ['What is my ApoB-to-ApoA1 ratio, and what does it indicate about my vascular balance?'],
  },
  'Lipoprotein (a)': {
    explanation: 'Lipoprotein(a) is an LDL-like particle with an added apolipoprotein(a) protein. Elevated Lp(a) is an independent, genetically determined risk factor for premature cardiovascular disease and aortic stenosis.',
    factors: 'Lp(a) levels are largely determined by genetics (over 90%) and remain relatively constant throughout life regardless of lifestyle.',
    questions: ['Given my Lp(a) level, how aggressively should other cardiovascular risk factors (LDL, blood pressure) be managed?'],
  },
  'Troponin I': {
    explanation: 'High-sensitivity Cardiac Troponin I is a highly sensitive and specific biomarker released into the blood when heart muscle cells (myocytes) experience stress or injury.',
    factors: 'Myocardial infarction, acute heart failure, myocarditis, severe sepsis, or prolonged extreme endurance exercise can elevate troponin.',
    questions: ['Is my cardiac troponin reading within the safe baseline range?'],
  },
  'CK-MB': {
    explanation: 'Creatine Kinase-MB is an isoenzyme found predominantly in myocardial (heart) tissue, used alongside troponin to assess cardiac muscle damage.',
    factors: 'Severe skeletal muscle trauma or intense physical exercise can occasionally cause non-cardiac CK elevation.',
    questions: ['Does my CK-MB level indicate any acute or recent myocardial stress?'],
  },
  'NT-proBNP': {
    explanation: 'N-terminal pro B-type natriuretic peptide is released by heart ventricles in response to increased cardiac wall stress and pressure overload. It is a key diagnostic marker for heart failure.',
    factors: 'Age, kidney filtration (eGFR), obesity (lower levels), atrial fibrillation, and fluid retention shift NT-proBNP levels.',
    questions: ['What does my NT-proBNP level suggest regarding cardiac chamber strain or fluid balance?'],
  },
  'Total Cholesterol': {
    explanation: 'Total cholesterol is the combined measurement of all cholesterol in your blood, including HDL (good), LDL (bad), and VLDL. Cholesterol is essential for cell membranes and hormone production, but high levels are a risk factor for heart and vessel disease.',
    factors: 'Diet (especially saturated fat), physical activity, weight, age, sex, genetics, and certain medications affect cholesterol. A non-fasting sample may show slightly higher values.',
    questions: ['Should I have a full fasting lipid profile including HDL, LDL and triglycerides?', 'Are any of my medications affecting my cholesterol levels?'],
  },
  'HDL Cholesterol': {
    explanation: 'HDL (high-density lipoprotein) is often called "good cholesterol". It carries cholesterol away from arteries back to the liver. Higher HDL levels are generally associated with lower cardiovascular risk.',
    factors: 'Regular aerobic exercise, moderate alcohol consumption, smoking cessation, and certain medications can raise HDL. Obesity, physical inactivity, and high triglycerides tend to lower it.',
    questions: ['What lifestyle changes could help improve my HDL level if it is low?'],
  },
  'LDL Cholesterol': {
    explanation: 'LDL (low-density lipoprotein) is often called "bad cholesterol". High LDL levels are associated with fatty plaque buildup in arteries, which can increase the risk of heart attack and stroke.',
    factors: 'Diet, physical activity, weight, genetics, and medications such as statins all affect LDL. If calculated using the Friedewald formula, very high triglycerides make the result unreliable.',
    questions: ['Is my LDL calculated or measured directly?', 'What is my overall cardiovascular risk, and does my LDL need treatment?'],
  },
  'Triglycerides': {
    explanation: 'Triglycerides are a type of fat in your blood, stored after eating excess calories. High triglycerides can contribute to hardening of arteries and are often associated with other metabolic risk factors.',
    factors: 'Eating shortly before the test, alcohol consumption, uncontrolled diabetes, thyroid conditions, kidney disease, and certain medications can all raise triglycerides significantly.',
    questions: ['Was this test done fasting? If not, should I repeat it fasting?'],
  },
  'Serum Creatinine': {
    explanation: 'Creatinine is a waste product of muscle metabolism, filtered out by the kidneys. A rising creatinine usually signals reduced kidney filtering capacity.',
    factors: 'Muscle mass, dietary protein intake, some medications (including creatine supplements), hydration, and acute conditions like dehydration or infections can affect creatinine.',
    questions: ['Can you calculate my eGFR from this creatinine level?', 'Is this a new change compared to previous results?'],
  },
  'Blood Urea Nitrogen': {
    explanation: 'BUN is a measure of urea nitrogen in blood, a breakdown product of protein metabolism. It is used alongside creatinine to assess kidney function.',
    factors: 'High-protein diet, dehydration, gastrointestinal bleeding, and liver disease (low BUN) can affect the reading independently of kidney function.',
    questions: ['What is my BUN-to-creatinine ratio, and what does it suggest?'],
  },
  'Albumin': {
    explanation: 'Albumin is the main protein produced by the liver. It keeps fluid from leaking out of blood vessels and transports hormones, vitamins, and drugs throughout the body.',
    factors: 'Liver disease, kidney disorders (nephrotic syndrome), malnutrition, inflammation, and hydration status influence albumin levels.',
    questions: ['Does my albumin level reflect my overall nutritional and liver health?'],
  },
  'Total Protein': {
    explanation: 'Total Protein measures the two main classes of proteins in blood: albumin and globulin. It provides an overall assessment of nutritional status and liver/kidney function.',
    factors: 'Dehydration can falsely elevate total protein, while overhydration, malnutrition, or chronic liver/kidney disease can lower it.',
    questions: ['What does the balance between my albumin and globulin suggest?'],
  },
  'INR': {
    explanation: 'INR (International Normalised Ratio) measures how long it takes your blood to form a clot, standardised for comparison between laboratories. It is used to monitor anticoagulant (blood-thinning) medication and check clotting disorders.',
    factors: 'Vitamin K intake (green vegetables), antibiotics, liver function, and many medications interact with INR. Results must be interpreted with knowledge of current medications.',
    questions: ['Is my INR in the target range for my specific indication?', 'Are there any medications or foods I should adjust?'],
  },
  'C-Reactive Protein': {
    explanation: 'CRP is a protein made by the liver in response to inflammation or infection. Elevated CRP indicates inflammation somewhere in the body but does not pinpoint the cause.',
    factors: 'Any infection, injury, chronic inflammation, or autoimmune condition can raise CRP. High-sensitivity CRP (hs-CRP) is used specifically for cardiovascular risk assessment.',
    questions: ['Is this a standard CRP or a high-sensitivity (hs-CRP) result?', 'What is the likely source of inflammation given my symptoms?'],
  },
  'ESR': {
    explanation: 'ESR (erythrocyte sedimentation rate) is how fast red blood cells settle in a tube of blood. It is a non-specific indicator of inflammation or infection.',
    factors: 'Age, sex (higher in females), anaemia, pregnancy, and many inflammatory or infectious conditions affect ESR. It is a screening marker rather than a specific diagnostic test.',
    questions: ['Should other inflammatory markers (CRP, ferritin) be checked alongside this result?'],
  },
  'LH': {
    explanation: 'Luteinizing Hormone (LH) is produced by the pituitary gland to regulate ovulation and reproductive function. Elevated baseline LH is frequently observed in polycystic ovary syndrome (PCOS).',
    factors: 'Menstrual cycle phase (surges during ovulation), oral contraceptives, stress, and pituitary function affect LH levels.',
    questions: ['Was this test taken on Day 2-4 of my menstrual cycle?', 'How does my LH level compare to my FSH reading?'],
  },
  'FSH': {
    explanation: 'Follicle-Stimulating Hormone (FSH) promotes egg follicle development in the ovaries. Evaluating FSH alongside LH helps assess ovarian reserve and hormonal balance.',
    factors: 'Cycle timing, age, perimenopause, hormonal therapy, and thyroid dysfunction can shift FSH concentrations.',
    questions: ['What does my LH-to-FSH ratio suggest regarding ovarian function?'],
  },
  'LH/FSH Ratio': {
    explanation: 'The LH/FSH ratio compares the relative concentrations of luteinizing hormone and follicle-stimulating hormone. A ratio greater than 2:1 is a recognized biomarker characteristic of PCOS.',
    factors: 'Timing during the early follicular phase (Day 2 to 4) is critical for accurate baseline ratio assessment.',
    questions: ['Does my calculated LH/FSH ratio support a clinical assessment for PCOS?'],
  },
  'Total Testosterone': {
    explanation: 'Total Testosterone measures both bound and free testosterone in the bloodstream. In biological females, elevated testosterone can indicate ovarian or adrenal androgen excess (hyperandrogenism).',
    factors: 'Time of day (highest in morning), menstrual cycle phase, medications, and physical exercise can temporarily alter levels.',
    questions: ['Would a Free Androgen Index or DHEA-S test provide further clarity?'],
  },
  'Free Androgen Index': {
    explanation: 'Free Androgen Index (FAI) evaluates the proportion of circulating testosterone not bound to SHBG, representing biologically active androgen.',
    factors: 'Changes in SHBG levels, obesity, insulin resistance, and thyroid function influence the index.',
    questions: ['How does my FAI correlate with physical symptoms like acne or irregular cycles?'],
  },
  'Anti-Mullerian Hormone (AMH)': {
    explanation: 'AMH is secreted by growing ovarian follicles and serves as a biomarker of ovarian reserve. High AMH levels are strongly correlated with polycystic ovarian morphology.',
    factors: 'AMH remains relatively stable throughout the menstrual cycle, though oral contraceptives can cause mild suppression.',
    questions: ['What does my AMH level indicate regarding my ovarian follicle count?'],
  },
  'Prolactin': {
    explanation: 'Prolactin stimulates breast development and lactation. Checking prolactin rules out hyperprolactinemia as a distinct cause of irregular or absent periods.',
    factors: 'Sleep, emotional stress, recent meals, breast stimulation, and medications (antidepressants, antipsychotics) can elevate prolactin.',
    questions: ['Should this prolactin test be repeated fasting and after resting?'],
  },
  'Fasting Insulin': {
    explanation: 'Fasting Insulin measures resting insulin secretion from the pancreas. Elevated fasting insulin indicates underlying metabolic insulin resistance even if blood glucose remains in normal range.',
    factors: 'Acute dietary intake, physical inactivity, sleep deprivation, and body composition alter fasting insulin.',
    questions: ['Does my fasting insulin indicate insulin resistance, and would dietary modifications help?'],
  },
  'HOMA-IR': {
    explanation: 'HOMA-IR (Homeostatic Model Assessment of Insulin Resistance) mathematically relates fasting glucose and fasting insulin. A score above 2.0 indicates reduced insulin sensitivity.',
    factors: 'Strict 8-12 hour fasting is required for mathematically valid HOMA-IR calculation.',
    questions: ['What lifestyle interventions or medical therapies are recommended for my HOMA-IR score?'],
  },
  'Vitamin D (25-OH)': {
    explanation: 'Vitamin D (25-Hydroxyvitamin D) is essential for calcium absorption, bone density, immune regulation, and endocrine metabolic balance.',
    factors: 'Sunlight exposure, skin pigmentation, dietary intake, season, and malabsorption syndromes affect vitamin D levels.',
    questions: ['Is a vitamin D3 supplement recommended based on this reading?'],
  },
};

export function generateLocalExplanations(measurements: LocalMeasurement[]): LocalExplanation[] {
  return measurements.map((m): LocalExplanation => {
    const known = TEST_EXPLANATIONS[m.testName];
    const refStr = m.referenceRangeText ?? undefined;
    return {
      testName: m.testName,
      valueAndUnit: m.unit ? `${m.rawValue}` : m.rawValue,
      referenceRange: refStr,
      status: m.resultFlag === 'unknown' ? 'unknown' : m.resultFlag,
      simpleExplanation: known?.explanation ?? `${m.testName} is a laboratory test result. Consult your clinician for interpretation in your specific clinical context.`,
      limitationsAndFactors: known?.factors ?? 'Many factors can influence laboratory results. A single measurement should be interpreted alongside your full medical history.',
      clinicianQuestions: known?.questions ?? [`What does my ${m.testName} result mean in my specific clinical situation?`],
    };
  });
}
