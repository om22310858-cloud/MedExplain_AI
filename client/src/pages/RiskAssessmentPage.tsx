import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService.js';
import { riskService } from '../services/riskService.js';
import { MedicalReport, RiskAssessment, AssessmentType, WhatIfScenario, CATEGORY_META, ASSESSMENT_META } from '../types/index.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Select.js';
import { Badge } from '../components/common/Badge.js';
import { Alert } from '../components/common/Alert.js';
import {
  Activity,
  HeartPulse,
  Sliders,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const RiskAssessmentPage: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AssessmentType>('ada_diabetes_prediabetes');

  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual inputs for tests that require clinical parameters not printed on lab slips (e.g. Blood Pressure)
  const [manualAge, setManualAge] = useState<number | ''>('');
  const [manualGender, setManualGender] = useState<'male' | 'female'>('male');
  const [manualSystolicBp, setManualSystolicBp] = useState<number | ''>('');
  const [manualSmoker, setManualSmoker] = useState<boolean>(false);
  // Stroke-specific clinical flags
  const [manualHypertension, setManualHypertension] = useState<boolean>(false);
  const [manualAtrialFib, setManualAtrialFib] = useState<boolean>(false);
  const [manualDiabetic, setManualDiabetic] = useState<boolean>(false);

  // What-If scenario
  const [hypotheticalInputs, setHypotheticalInputs] = useState<Record<string, number>>({});
  const [simulatedScenario, setSimulatedScenario] = useState<WhatIfScenario | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoadingReports(true);
      try {
        const data = await reportService.getReports({ limit: 50 });
        setReports(data.reports);
        if (data.reports.length > 0) {
          setSelectedReportId(data.reports[0]._id);
        }
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setIsLoadingReports(false);
      }
    };
    fetchReports();
  }, []);

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedReportId) return;

    setIsEvaluating(true);
    setError(null);
    setSimulatedScenario(null);

    const manualInputs: Record<string, unknown> = {};
    if (manualAge !== '') manualInputs.age = Number(manualAge);
    if (manualGender) manualInputs.gender = manualGender;
    if (manualSystolicBp !== '') manualInputs.systolicBp = Number(manualSystolicBp);
    if (manualSmoker !== undefined) manualInputs.smoker = manualSmoker;
    if (selectedType === 'stroke_nihss_risk_factors') {
      manualInputs.hypertension = manualHypertension;
      manualInputs.atrialFibrillation = manualAtrialFib;
      manualInputs.diabetic = manualDiabetic;
    }

    try {
      const res = await riskService.evaluateRisk(selectedReportId, selectedType, manualInputs);
      setAssessment(res);
    } catch (err: any) {
      setError(err.customMessage || 'Failed to evaluate clinical criteria.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSimulate = async () => {
    if (!assessment) return;
    setIsSimulating(true);
    try {
      const scenario = await riskService.createWhatIfScenario(
        assessment._id,
        'Hypothetical Parameter Scenario',
        hypotheticalInputs
      );
      setSimulatedScenario(scenario);
    } catch (err: any) {
      alert(err.customMessage || 'Failed to calculate scenario.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Evidence-Grounded Risk Assessment
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Assess laboratory reports against validated clinical guidelines (ADA, KDIGO CKD-EPI, ACC/AHA 10-Year ASCVD).
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configure Clinical Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEvaluate} className="space-y-4">
            {error && (
              <Alert variant="destructive" title="Notice">
                {error}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Select Medical Report"
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                required
              >
                <option value="">Select a report...</option>
                {reports.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.title} ({r.category})
                  </option>
                ))}
              </Select>

              <Select
                label="Clinical Assessment Rule Set"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as AssessmentType)}
              >
                <option value="ada_diabetes_prediabetes">
                  ADA 2024 Standards of Care — Glycaemic / Prediabetes
                </option>
                <option value="ckd_egfr">
                  KDIGO 2012 / CKD-EPI 2021 — Kidney Filtration (eGFR)
                </option>
                <option value="cardiovascular_ascvd">
                  2013 ACC/AHA — 10-Year ASCVD Cardiovascular Risk
                </option>
                <option value="thyroid_reference_range">
                  Thyroid Reference Range Comparison (TSH, FT3, FT4)
                </option>
                <option value="cbc_reference_range">
                  CBC Reference Range Comparison (Hb, WBC, Platelets)
                </option>
                <option value="stroke_nihss_risk_factors">
                  Stroke Workup — Coagulation &amp; Inflammatory Markers
                </option>
              </Select>
            </div>

            {/* Optional Clinical Parameters Panel */}
            <div className="rounded-lg bg-muted/40 p-4 border border-border/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Info className="h-4 w-4 text-primary-600" />
                {selectedType === 'stroke_nihss_risk_factors'
                  ? 'Clinical Risk Factors (for Stroke Workup context)'
                  : 'Physical & Clinical History Parameters (Used for CKD & ASCVD equations)'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Age (Years)</label>
                  <input type="number" placeholder="e.g. 52" value={manualAge}
                    onChange={(e) => setManualAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Biological Sex</label>
                  <select value={manualGender} onChange={(e) => setManualGender(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                {selectedType !== 'stroke_nihss_risk_factors' && (
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Systolic BP (mmHg)</label>
                    <input type="number" placeholder="e.g. 125" value={manualSystolicBp}
                      onChange={(e) => setManualSystolicBp(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background" />
                  </div>
                )}
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="smoker" checked={manualSmoker} onChange={(e) => setManualSmoker(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary-600" />
                  <label htmlFor="smoker" className="text-xs text-foreground cursor-pointer">Current Smoker</label>
                </div>
              </div>
              {/* Stroke-specific clinical flags */}
              {selectedType === 'stroke_nihss_risk_factors' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="htn" checked={manualHypertension} onChange={(e) => setManualHypertension(e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary-600" />
                    <label htmlFor="htn" className="text-xs text-foreground cursor-pointer">Known Hypertension</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="afib" checked={manualAtrialFib} onChange={(e) => setManualAtrialFib(e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary-600" />
                    <label htmlFor="afib" className="text-xs text-foreground cursor-pointer">Atrial Fibrillation</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="diabetic" checked={manualDiabetic} onChange={(e) => setManualDiabetic(e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary-600" />
                    <label htmlFor="diabetic" className="text-xs text-foreground cursor-pointer">Known Diabetes</label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isEvaluating}
                disabled={!selectedReportId}
              >
                <Activity className="h-4 w-4 mr-2" />
                Evaluate Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Assessment Output Display */}
      {assessment && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">{assessment.methodIdentifier}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Guideline Version: {assessment.methodVersion} • Method Type: {assessment.methodType}
                </p>
              </div>
              {assessment.isEligible ? (
                <Badge
                  variant={
                    assessment.output?.status === 'high'
                      ? 'destructive'
                      : assessment.output?.status === 'borderline' ||
                        assessment.output?.status === 'intermediate'
                      ? 'warning'
                      : 'success'
                  }
                  className="capitalize font-semibold"
                >
                  {assessment.output?.status} Status
                </Badge>
              ) : (
                <Badge variant="destructive">Data Insufficient</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.isEligible && assessment.output ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {assessment.output.summary}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {assessment.output.details}
                    </p>
                  </div>

                  {assessment.output.recommendations.length > 0 && (
                    <div className="rounded-lg bg-teal-50/50 dark:bg-teal-950/20 p-4 border border-teal-200 dark:border-teal-900 space-y-2">
                      <strong className="text-xs font-semibold text-teal-900 dark:text-teal-200 block">
                        Evidence-Based Clinical Guidance:
                      </strong>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {assessment.output.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="warning" title="Required Parameters Missing">
                  <p className="text-sm">{assessment.explanation}</p>
                  {assessment.missingInputs.length > 0 && (
                    <div className="mt-2 text-xs">
                      <strong>Missing required biomarkers/inputs:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {assessment.missingInputs.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Alert>
              )}

              {/* Explainability Block */}
              <div className="rounded-lg bg-muted/30 p-3.5 border border-border/80 text-xs text-muted-foreground space-y-1">
                <strong className="text-foreground block">Explainability & Reasoning:</strong>
                <p>{assessment.explanation}</p>
              </div>

              {assessment.limitations.length > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  <strong>Limitations:</strong> {assessment.limitations.join(' ')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* What-If Sandbox linked to this assessment */}
          {assessment.isEligible && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-teal-600" />
                  <CardTitle className="text-base">What-If Parameter Sandbox</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Simulate modified values to observe potential changes in calculated score without altering original reports.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1">
                      Glucose (mg/dL)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 90"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                      onChange={(e) =>
                        setHypotheticalInputs((prev) => ({
                          ...prev,
                          glucose: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1">
                      HbA1c (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.4"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                      onChange={(e) =>
                        setHypotheticalInputs((prev) => ({
                          ...prev,
                          hba1c: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1">
                      Creatinine (mg/dL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 0.8"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                      onChange={(e) =>
                        setHypotheticalInputs((prev) => ({
                          ...prev,
                          creatinine: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1">
                      Systolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 118"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                      onChange={(e) =>
                        setHypotheticalInputs((prev) => ({
                          ...prev,
                          systolicBp: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleSimulate}
                  isLoading={isSimulating}
                >
                  Recalculate Hypothetical Score
                </Button>

                {simulatedScenario && (
                  <div className="rounded-lg border border-teal-500/40 bg-teal-50/20 p-4 space-y-2 animate-in fade-in">
                    <span className="text-xs font-semibold text-teal-800 dark:text-teal-200">
                      Hypothetical Outcome:
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {simulatedScenario.result.summary}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {simulatedScenario.result.details}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
