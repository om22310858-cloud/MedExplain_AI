import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService.js';
import { comparisonService } from '../services/comparisonService.js';
import { MedicalReport, ReportComparison, MatchedMeasurement } from '../types/index.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Select.js';
import { Badge } from '../components/common/Badge.js';
import { Alert } from '../components/common/Alert.js';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Calendar,
  BarChart2,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const CompareReportsPage: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [olderReportId, setOlderReportId] = useState<string>('');
  const [newerReportId, setNewerReportId] = useState<string>('');

  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState<ReportComparison | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing comparisons list
  const [pastComparisons, setPastComparisons] = useState<ReportComparison[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingReports(true);
      try {
        const [reportsData, comparisonsData] = await Promise.all([
          reportService.getReports({ limit: 100 }),
          comparisonService.getComparisons(),
        ]);
        setReports(reportsData.reports);
        setPastComparisons(comparisonsData);

        // Pre-select if at least 2 reports exist
        if (reportsData.reports.length >= 2) {
          setOlderReportId(reportsData.reports[1]._id);
          setNewerReportId(reportsData.reports[0]._id);
        }
      } catch (err) {
        console.error('Failed to load initial reports for comparison', err);
      } finally {
        setIsLoadingReports(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleRunComparison = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!olderReportId || !newerReportId) {
      setErrorMessage('Please select both an older report and a newer report.');
      return;
    }
    if (olderReportId === newerReportId) {
      setErrorMessage('Please select two distinct reports to compare.');
      return;
    }

    setIsComparing(true);
    setErrorMessage(null);

    try {
      const result = await comparisonService.createComparison(olderReportId, newerReportId);
      setComparison(result);
      setPastComparisons((prev) => [result, ...prev.filter((c) => c._id !== result._id)]);
    } catch (err: any) {
      setErrorMessage(
        err.customMessage ||
          'Failed to compare selected reports. Ensure both reports have extracted measurements.'
      );
    } finally {
      setIsComparing(false);
    }
  };

  const getDirectionBadge = (m: MatchedMeasurement) => {
    if (m.direction === 'increased') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
          <TrendingUp className="h-3.5 w-3.5" />
          +{m.changePercentage !== null ? `${m.changePercentage}%` : ''}
        </span>
      );
    }
    if (m.direction === 'decreased') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingDown className="h-3.5 w-3.5" />
          {m.changePercentage !== null ? `${m.changePercentage}%` : ''}
        </span>
      );
    }
    if (m.direction === 'unchanged') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Minus className="h-3.5 w-3.5" /> Unchanged
        </span>
      );
    }
    return (
      <span className="text-[11px] text-muted-foreground italic">
        {m.comparisonStatus === 'unit_mismatch_unconvertible'
          ? 'Unit Mismatch'
          : 'Non-numeric'}
      </span>
    );
  };

  // Prepare chart data for numeric comparable tests
  const chartData = (comparison?.matchedMeasurements || [])
    .filter((m) => m.comparisonStatus === 'comparable' && m.olderValue.numeric !== null && m.newerValue.numeric !== null)
    .slice(0, 8)
    .map((m) => ({
      name: m.testName.length > 15 ? `${m.testName.slice(0, 15)}...` : m.testName,
      fullName: m.testName,
      Older: m.olderValue.numeric,
      Newer: m.newerValue.numeric,
      unit: m.normalizedUnit || '',
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Compare Medical Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select two chronological reports to trace biomarker trends, unit-normalized shifts, and grounded clinical summaries.
        </p>
      </div>

      {/* Report Selection Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Reports for Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRunComparison} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" title="Comparison Notice">
                {errorMessage}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Baseline / Older Report"
                value={olderReportId}
                onChange={(e) => setOlderReportId(e.target.value)}
                required
              >
                <option value="">Select an older report...</option>
                {reports.map((r) => (
                  <option key={r._id} value={r._id} disabled={r._id === newerReportId}>
                    {r.title} (
                    {r.reportDate
                      ? format(new Date(r.reportDate), 'MMM yyyy')
                      : format(new Date(r.createdAt), 'MMM yyyy')}
                    )
                  </option>
                ))}
              </Select>

              <Select
                label="Follow-Up / Newer Report"
                value={newerReportId}
                onChange={(e) => setNewerReportId(e.target.value)}
                required
              >
                <option value="">Select a newer report...</option>
                {reports.map((r) => (
                  <option key={r._id} value={r._id} disabled={r._id === olderReportId}>
                    {r.title} (
                    {r.reportDate
                      ? format(new Date(r.reportDate), 'MMM yyyy')
                      : format(new Date(r.createdAt), 'MMM yyyy')}
                    )
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Both reports must have extracted laboratory measurements.
              </p>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isComparing}
                disabled={isLoadingReports || reports.length < 2}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Reports
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Comparison Results */}
      {comparison && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Grounded Summary Card */}
          <Card className="border-primary-200 dark:border-primary-900 bg-primary-50/30 dark:bg-primary-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary-600" />
                <CardTitle className="text-base">Grounded Comparison Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {comparison.comparisonSummary}
              </p>
            </CardContent>
          </Card>

          {/* Recharts Visual Trend Bar Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Biomarker Trend Visualization</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Side-by-side comparison of numeric biomarkers with normalized units
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dataItem = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs">
                                <p className="font-semibold text-foreground mb-1">
                                  {dataItem.fullName}
                                </p>
                                <p className="text-primary-600">
                                  Older: {dataItem.Older} {dataItem.unit}
                                </p>
                                <p className="text-teal-600">
                                  Newer: {dataItem.Newer} {dataItem.unit}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Older" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Newer" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Differences Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Matched Test Comparisons</CardTitle>
              <p className="text-xs text-muted-foreground">
                Detailed side-by-side metrics with normalized differentials
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                      <th className="py-3 px-4">Test Name</th>
                      <th className="py-3 px-4">Older Value</th>
                      <th className="py-3 px-4">Newer Value</th>
                      <th className="py-3 px-4">Normalized Unit</th>
                      <th className="py-3 px-4">Absolute Diff</th>
                      <th className="py-3 px-4">Trend Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {comparison.matchedMeasurements.map((m, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {m.testName}
                          {m.referenceRange && (
                            <span className="block text-[11px] text-muted-foreground">
                              Ref: {m.referenceRange}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">{m.olderValue.raw}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {m.newerValue.raw}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {m.normalizedUnit || '—'}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {m.changeAbsolute !== null && m.changeAbsolute !== undefined
                            ? `${m.changeAbsolute > 0 ? '+' : ''}${m.changeAbsolute}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4">{getDirectionBadge(m)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
