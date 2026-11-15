import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportService, ReportDetailResponse } from '../services/reportService.js';
import { riskService } from '../services/riskService.js';
import {
  MedicalReport,
  ExtractedMeasurement,
  ReportAnalysis,
  RiskAssessment,
  AssessmentType,
  WhatIfScenario,
  CATEGORY_META,
  ASSESSMENT_META,
} from '../types/index.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Alert } from '../components/common/Alert.js';
import { MeasurementEditModal } from '../components/analysis/MeasurementEditModal.js';
import {
  FileText,
  Sparkles,
  Download,
  RotateCw,
  CheckCircle2,
  Edit3,
  Activity,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Layers,
  Sliders,
  ShieldAlert,
  AlertCircle,
  User,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { format } from 'date-fns';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ReportDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'measurements' | 'analysis' | 'risk' | 'whatif'
  >('measurements');

  // Analysis re-run state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  // Editing measurement modal state
  const [editingMeasurement, setEditingMeasurement] = useState<ExtractedMeasurement | null>(null);
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);

  // Risk evaluation state
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentType>('ada_diabetes_prediabetes');
  const [isEvaluatingRisk, setIsEvaluatingRisk] = useState(false);
  const [currentRiskAssessment, setCurrentRiskAssessment] = useState<RiskAssessment | null>(null);

  // What-If scenario inputs
  const [scenarioName, setScenarioName] = useState('My Lifestyle Scenario');
  const [whatIfInputs, setWhatIfInputs] = useState<Record<string, number>>({});
  const [calculatedScenario, setCalculatedScenario] = useState<WhatIfScenario | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await reportService.getReportById(id);
      setData(response);

      // Pre-select existing risk assessment if one exists
      if (response.riskAssessments && response.riskAssessments.length > 0) {
        setCurrentRiskAssessment(response.riskAssessments[0]);
        setSelectedAssessmentType(response.riskAssessments[0].assessmentType);
      } else if (response.supportedAssessments && response.supportedAssessments.length > 0) {
        // Pre-select the first supported assessment type for this category
        setSelectedAssessmentType(response.supportedAssessments[0]);
      }
    } catch (err) {
      console.error('Failed to load report detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setAnalysisNotice(null);
    fetchDetail();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    setAnalysisNotice(null);
    try {
      const res = await reportService.triggerAnalysis(id);
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          report: res.report,
          measurements: res.measurements || prev.measurements,
          analysis: res.analysis || prev.analysis,
        };
      });
      if (res.message) {
        setAnalysisNotice(res.message);
      }
      setActiveTab('analysis');
    } catch (err: any) {
      setAnalysisNotice(err.customMessage || 'Analysis failed. Check document format or API settings.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAll = async () => {
    if (!id) return;
    try {
      const updatedReport = await reportService.confirmAllMeasurements(id);
      setData((prev) => (prev ? { ...prev, report: updatedReport } : null));
      // update measurements locally to confirmed
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          measurements: prev.measurements.map((m) => ({ ...m, userConfirmed: true })),
        };
      });
    } catch (err) {
      console.error('Failed to confirm measurements', err);
    }
  };

  const handleMeasurementSaved = (updated: ExtractedMeasurement) => {
    setData((prev) => {
      if (!prev) return null;
      const exists = prev.measurements.some((m) => m._id === updated._id);
      return {
        ...prev,
        measurements: exists
          ? prev.measurements.map((m) => (m._id === updated._id ? updated : m))
          : [...prev.measurements, updated],
      };
    });
  };

  const handleDownload = async () => {
    if (!data?.report) return;
    try {
      await reportService.downloadReport(data.report._id, data.report.originalFilename);
    } catch (err: any) {
      setAnalysisNotice(err.customMessage || 'Failed to download the original file.');
    }
  };

  const handleEvaluateRisk = async (type: AssessmentType) => {
    if (!id) return;
    setIsEvaluatingRisk(true);
    try {
      const assessment = await riskService.evaluateRisk(id, type);
      setCurrentRiskAssessment(assessment);
      setData((prev) => {
        if (!prev) return null;
        const filtered = prev.riskAssessments.filter((r) => r.assessmentType !== type);
        return {
          ...prev,
          riskAssessments: [...filtered, assessment],
        };
      });
    } catch (err) {
      console.error('Failed to evaluate risk', err);
    } finally {
      setIsEvaluatingRisk(false);
    }
  };

  const handleSimulateScenario = async () => {
    if (!currentRiskAssessment) return;
    setIsSimulating(true);
    try {
      const scenario = await riskService.createWhatIfScenario(
        currentRiskAssessment._id,
        scenarioName,
        whatIfInputs
      );
      setCalculatedScenario(scenario);
    } catch (err: any) {
      alert(err.customMessage || 'Failed to simulate scenario.');
    } finally {
      setIsSimulating(false);
    }
  };

  const getResultFlagBadge = (flag: string) => {
    switch (flag) {
      case 'normal':
        return <Badge variant="success">Normal</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'low':
        return <Badge variant="warning">Low</Badge>;
      case 'abnormal':
        return <Badge variant="destructive">Abnormal</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!data || !data.report) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested medical report was not found or access is denied.</p>
        <Button onClick={() => navigate('/reports')} variant="primary">
          Back to My Reports
        </Button>
      </div>
    );
  }

  const { report, measurements, analysis } = data;

  return (
    <div className="space-y-6">
      {/* Category Mismatch Warning */}
      {report.categoryMismatchFlag && (
        <Alert variant="warning" title="Possible Category Mismatch">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-xs">
              {report.categoryMismatchFlag}{' '}
              <span className="text-muted-foreground">
                You can update the category using the edit button if needed. The original file is preserved.
              </span>
            </div>
          </div>
        </Alert>
      )}

      {/* Top Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase font-semibold">
                  {CATEGORY_META[report.category]?.label ?? report.category}
                </Badge>
                <Badge variant="outline" className="text-xs uppercase font-semibold">
                  {report.documentType.replace('_', ' ')}
                </Badge>
                {report.analysisStatus === 'completed' && <Badge variant="success">AI Analyzed</Badge>}
                {report.analysisStatus === 'unavailable' && (
                  <Badge variant="warning">AI Unconfigured (Manual Mode)</Badge>
                )}
                {report.processingStatus === 'completed' && (
                  <Badge variant="info">Measurements Confirmed</Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Specimen Date:{' '}
                  {report.reportDate
                    ? format(new Date(report.reportDate), 'MMMM d, yyyy')
                    : 'Not specified'}
                </span>
                <span>•</span>
                <span>Original File: {report.originalFilename}</span>
                <span>•</span>
                <span>Size: {(report.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center font-medium rounded-lg transition-colors border border-border bg-background hover:bg-muted text-foreground h-9 px-3 text-xs gap-1.5 shadow-xs"
              >
                <Download className="h-4 w-4 mr-1 text-muted-foreground" />
                Download Original
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRunAnalysis}
                isLoading={isAnalyzing}
              >
                <RotateCw className="h-4 w-4 mr-1.5" />
                {analysis ? 'Re-run Analysis' : 'Run AI Analysis'}
              </Button>
            </div>
          </div>

          {/* Patient Demographics & Clinical Profile */}
          {(report.patientName || report.patientAge != null || report.patientGender || report.physicianName || report.laboratoryName) && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Extracted Clinical Demographics
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {report.patientName && (
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary-500" /> Patient Name
                    </div>
                    <div className="text-xs font-semibold text-foreground truncate mt-1" title={report.patientName}>
                      {report.patientName}
                    </div>
                  </div>
                )}
                {(report.patientAge != null || report.patientDob) && (
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary-500" /> Age & DOB
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-1">
                      {report.patientAge != null ? `${report.patientAge} years` : ''}
                      {report.patientDob ? ` (${report.patientDob})` : ''}
                    </div>
                  </div>
                )}
                {report.patientGender && (
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary-500" /> Biological Sex
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-1 capitalize">
                      {report.patientGender}
                    </div>
                  </div>
                )}
                {report.physicianName && (
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary-500" /> Physician
                    </div>
                    <div className="text-xs font-semibold text-foreground truncate mt-1" title={report.physicianName}>
                      {report.physicianName}
                    </div>
                  </div>
                )}
                {report.laboratoryName && (
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary-500" /> Facility / Lab
                    </div>
                    <div className="text-xs font-semibold text-foreground truncate mt-1" title={report.laboratoryName}>
                      {report.laboratoryName}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {analysisNotice && (
            <div className="mt-4">
              <Alert variant="info" title="Analysis Status Update">
                {analysisNotice}
              </Alert>
            </div>
          )}

          {report.userNotes && (
            <div className="mt-4 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground border border-border/60">
              <strong className="text-foreground">Personal Notes:</strong> {report.userNotes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('measurements')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'measurements'
              ? 'border-primary text-primary-600 dark:text-primary-400 font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Extracted Values ({measurements.length})
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'analysis'
              ? 'border-primary text-primary-600 dark:text-primary-400 font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          AI Educational Explanations
        </button>

        <button
          onClick={() => setActiveTab('risk')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'risk'
              ? 'border-primary text-primary-600 dark:text-primary-400 font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="h-4 w-4" />
          Clinical Risk Assessment
        </button>

        <button
          onClick={() => setActiveTab('whatif')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'whatif'
              ? 'border-primary text-primary-600 dark:text-primary-400 font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          What-If Scenario Sandbox
        </button>
      </div>

      {/* TAB 1: EXTRACTED MEASUREMENTS TABLE */}
      {activeTab === 'measurements' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Extracted Laboratory Biomarkers</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review, verify, and correct laboratory measurements. Confirmed edits are recorded with full provenance tracking.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddMeasurementOpen(true)}>
                Add measurement
              </Button>
              {measurements.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConfirmAll}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Confirm All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {measurements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                      <th className="py-3 px-4">Test Name</th>
                      <th className="py-3 px-4">Extracted Value</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Reference Range</th>
                      <th className="py-3 px-4">Flag</th>
                      <th className="py-3 px-4">Provenance</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {measurements.map((m) => (
                      <tr key={m._id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {m.testName}
                          {m.testName !== m.originalTestName && (
                            <span className="block text-[11px] text-muted-foreground">
                              Printed: {m.originalTestName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {m.rawValue}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{m.unit || '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {m.referenceRangeText || 'Not printed'}
                        </td>
                        <td className="py-3 px-4">{getResultFlagBadge(m.resultFlag)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              m.provenance === 'user-corrected'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {m.provenance}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMeasurement(m)}
                            className="h-8 px-2 text-xs"
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1" />
                            Correct
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <h4 className="text-base font-semibold text-foreground">
                  No Structured Measurements Extracted
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Run AI extraction if a Gemini API key is configured, or enter printed values manually. Never invent values that are not on the document.
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={handleRunAnalysis} variant="primary" size="sm" isLoading={isAnalyzing}>
                    Run Extraction Now
                  </Button>
                  <Button onClick={() => setIsAddMeasurementOpen(true)} variant="outline" size="sm">
                    Enter values manually
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: AI EDUCATIONAL EXPLANATIONS */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {analysis ? (
            <>
              {/* Summary Card */}
              <Card className="bg-primary-50/40 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <CardTitle className="text-lg">Document Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-foreground">
                    {analysis.extractedSummary}
                  </p>
                  <div className="text-[11px] text-muted-foreground flex gap-3">
                    <span>Model: {analysis.modelIdentifier}</span>
                    <span>•</span>
                    <span>Prompt: {analysis.promptVersion}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Explanations Grid */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">
                  Test-by-Test Plain Language Explanations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.explanations.map((exp, idx) => (
                    <Card key={idx} className="flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{exp.testName}</CardTitle>
                          {getResultFlagBadge(exp.status)}
                        </div>
                        <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                          {exp.valueAndUnit}{' '}
                          {exp.referenceRange && `(Ref: ${exp.referenceRange})`}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs leading-relaxed">
                        <div>
                          <strong className="block text-foreground mb-0.5">What it measures:</strong>
                          <p className="text-muted-foreground">{exp.simpleExplanation}</p>
                        </div>

                        {exp.limitationsAndFactors && (
                          <div className="rounded-md bg-muted/60 p-2 text-muted-foreground">
                            <strong className="block text-foreground mb-0.5">Influencing factors:</strong>
                            <p>{exp.limitationsAndFactors}</p>
                          </div>
                        )}

                        {exp.clinicianQuestions && exp.clinicianQuestions.length > 0 && (
                          <div className="pt-1">
                            <strong className="flex items-center gap-1 text-teal-700 dark:text-teal-400 mb-1">
                              <HelpCircle className="h-3.5 w-3.5" /> Questions to ask your doctor:
                            </strong>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                              {exp.clinicianQuestions.map((q, qIdx) => (
                                <li key={qIdx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Mandatory Medical Disclaimer Banner */}
              <Alert variant="info" title="Important Medical Disclaimer" icon={true}>
                {analysis.disclaimer}
              </Alert>
            </>
          ) : (
            <div className="text-center py-12 space-y-3 bg-card border border-border rounded-xl p-6">
              <ShieldAlert className="h-8 w-8 text-primary-600 mx-auto" />
              <h4 className="text-base font-semibold text-foreground">
                No AI Analysis Available Yet
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Trigger the AI analysis engine to generate plain-language explanations and clinical discussion points for your doctor.
              </p>
              <Button onClick={handleRunAnalysis} variant="primary" size="sm" isLoading={isAnalyzing}>
                Run AI Analysis
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLINICAL RISK ASSESSMENT */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Select Validated Clinical Assessment</CardTitle>
              <p className="text-xs text-muted-foreground">
                Showing assessments supported for <strong>{CATEGORY_META[report.category]?.label ?? report.category}</strong> reports.
                You may also run any other supported method below.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary assessments for this category */}
              {data?.supportedAssessments && data.supportedAssessments.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold mb-2">
                    Recommended for {CATEGORY_META[report.category]?.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.supportedAssessments.map((type) => (
                      <Button
                        key={type}
                        variant={selectedAssessmentType === type ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => { setSelectedAssessmentType(type); handleEvaluateRisk(type); }}
                        isLoading={isEvaluatingRisk && selectedAssessmentType === type}
                      >
                        {ASSESSMENT_META[type as AssessmentType]?.shortLabel ?? type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other available methods */}
              {(() => {
                const allTypes: AssessmentType[] = ['ada_diabetes_prediabetes', 'ckd_egfr', 'cardiovascular_ascvd', 'thyroid_reference_range', 'cbc_reference_range', 'stroke_nihss_risk_factors'];
                const others = allTypes.filter((t) => !(data?.supportedAssessments ?? []).includes(t));
                if (others.length === 0) return null;
                return (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold mb-2">Other available methods</p>
                    <div className="flex flex-wrap gap-2">
                      {others.map((type) => (
                        <Button
                          key={type}
                          variant={selectedAssessmentType === type ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => { setSelectedAssessmentType(type); handleEvaluateRisk(type); }}
                          isLoading={isEvaluatingRisk && selectedAssessmentType === type}
                          className="text-muted-foreground"
                        >
                          {ASSESSMENT_META[type as AssessmentType]?.shortLabel ?? type}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {isEvaluatingRisk && !selectedAssessmentType ? (
                <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                  Evaluating clinical criteria...
                </div>
              ) : currentRiskAssessment ? (
                <div className="space-y-4 pt-2">
                  <div className="rounded-xl border border-border p-5 space-y-3 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">
                        {currentRiskAssessment.methodIdentifier} (v{currentRiskAssessment.methodVersion})
                      </span>
                      {currentRiskAssessment.isEligible ? (
                        <Badge
                          variant={
                            currentRiskAssessment.output?.status === 'high'
                              ? 'destructive'
                              : currentRiskAssessment.output?.status === 'borderline' ||
                                currentRiskAssessment.output?.status === 'intermediate'
                              ? 'warning'
                              : 'success'
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {currentRiskAssessment.output?.status} Status
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Data Insufficient</Badge>
                      )}
                    </div>

                    {currentRiskAssessment.isEligible && currentRiskAssessment.output ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-card border border-border">
                          <h4 className="text-base font-bold text-foreground">
                            {currentRiskAssessment.output.summary}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {currentRiskAssessment.output.details}
                          </p>
                        </div>

                        {currentRiskAssessment.output.recommendations.length > 0 && (
                          <div className="space-y-1.5 text-xs">
                            <strong className="text-foreground">Clinical Considerations:</strong>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                              {currentRiskAssessment.output.recommendations.map((rec, rIdx) => (
                                <li key={rIdx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert variant="warning" title="Assessment Unavailable">
                        <p>{currentRiskAssessment.explanation}</p>
                        {currentRiskAssessment.missingInputs.length > 0 && (
                          <div className="mt-2 text-xs">
                            <strong>Missing inputs:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {currentRiskAssessment.missingInputs.map((item, mIdx) => (
                                <li key={mIdx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Alert>
                    )}

                    <div className="text-[11px] text-muted-foreground pt-2 border-t border-border">
                      <strong className="text-foreground">Algorithm Explainability:</strong>{' '}
                      {currentRiskAssessment.explanation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Click one of the assessment criteria above to evaluate this report against clinical guidelines.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: WHAT-IF SCENARIO SIMULATION */}
      {activeTab === 'whatif' && (
        <Card>
          <CardHeader>
            <CardTitle>What-If Hypothetical Scenario Modeling</CardTitle>
            <p className="text-xs text-muted-foreground">
              Simulate how lifestyle improvements (e.g., lower glucose or improved blood pressure) would mathematically change your clinical risk scores.
              <strong className="text-foreground block mt-0.5">
                Note: This simulation never alters your original lab report records.
              </strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hypothetical Fasting Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 95"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  onChange={(e) =>
                    setWhatIfInputs((prev) => ({ ...prev, glucose: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hypothetical HbA1c (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.5"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  onChange={(e) =>
                    setWhatIfInputs((prev) => ({ ...prev, hba1c: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hypothetical Serum Creatinine (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 0.9"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  onChange={(e) =>
                    setWhatIfInputs((prev) => ({ ...prev, creatinine: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hypothetical Total Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 180"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  onChange={(e) =>
                    setWhatIfInputs((prev) => ({ ...prev, totalCholesterol: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hypothetical Systolic Blood Pressure (mmHg)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  onChange={(e) =>
                    setWhatIfInputs((prev) => ({ ...prev, systolicBp: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <Button
              variant="accent"
              size="md"
              onClick={handleSimulateScenario}
              isLoading={isSimulating}
              disabled={!currentRiskAssessment}
            >
              Calculate Hypothetical Outcome
            </Button>

            {!currentRiskAssessment && (
              <p className="text-xs text-amber-600">
                Please evaluate an assessment in the "Clinical Risk Assessment" tab first to enable simulation.
              </p>
            )}

            {calculatedScenario && (
              <div className="rounded-xl border border-teal-500/40 bg-teal-50/20 dark:bg-teal-950/20 p-5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">
                    Hypothetical Result: {calculatedScenario.scenarioName}
                  </span>
                  <Badge variant="info">Hypothetical Simulation</Badge>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                  <h4 className="text-base font-bold text-foreground">
                    {calculatedScenario.result.summary}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculatedScenario.result.details}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {calculatedScenario.explanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Measurement Modal */}
      <MeasurementEditModal
        isOpen={!!editingMeasurement || isAddMeasurementOpen}
        onClose={() => {
          setEditingMeasurement(null);
          setIsAddMeasurementOpen(false);
        }}
        reportId={report._id}
        measurement={editingMeasurement}
        onSaved={handleMeasurementSaved}
      />
    </div>
  );
};
