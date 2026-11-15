import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { dashboardService } from '../services/dashboardService.js';
import { DashboardStats, MedicalReport, CATEGORY_META } from '../types/index.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import {
  FileText,
  Sparkles,
  GitCompare,
  Activity,
  Upload,
  Calendar,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { openUploadModal } = useOutletContext<{ openUploadModal: () => void }>();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.customMessage || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (report: MedicalReport) => {
    if (report.analysisStatus === 'completed') {
      return <Badge variant="success">Analyzed</Badge>;
    }
    if (report.analysisStatus === 'unavailable') {
      return <Badge variant="warning">Manual / Stored</Badge>;
    }
    if (report.analysisStatus === 'pending') {
      return <Badge variant="info">Processing</Badge>;
    }
    if (report.analysisStatus === 'failed') {
      return <Badge variant="destructive">Needs Review</Badge>;
    }
    return <Badge variant="outline">Uploaded</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_META[category as keyof typeof CATEGORY_META]?.label ?? category;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-teal-700 p-6 sm:p-8 text-white shadow-md">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-primary-100 leading-relaxed">
            Review, understand, and compare your laboratory reports with structured AI document extraction and clinical explainability.
          </p>
        </div>
        <div className="shrink-0 flex gap-2.5">
          <Button
            onClick={openUploadModal}
            variant="secondary"
            className="bg-white text-primary-800 hover:bg-primary-50 font-semibold shadow-sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Report
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Documents
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? '...' : stats?.totalReports ?? 0}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Stored in private storage</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Analyses
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? '...' : stats?.totalAnalyses ?? 0}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Structured explanations</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Extracted Values
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? '...' : stats?.totalMeasurements ?? 0}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Individual biomarkers</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Report Comparisons
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? '...' : stats?.totalComparisons ?? 0}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Historical trend diffs</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <GitCompare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Reports & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Medical Reports</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest uploaded clinical documents and extraction statuses
                </p>
              </div>
              <Link
                to="/reports"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-14 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : stats?.recentReports && stats.recentReports.length > 0 ? (
                <div className="divide-y divide-border">
                  {stats.recentReports.map((report) => (
                    <div
                      key={report._id}
                      className="flex items-center justify-between py-3.5 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/reports/${report._id}`}
                            className="font-semibold text-sm text-foreground hover:text-primary-600 truncate block"
                          >
                            {report.title}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{getCategoryLabel(report.category)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {report.reportDate
                                ? format(new Date(report.reportDate), 'MMM d, yyyy')
                                : format(new Date(report.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(report)}
                        <Link
                          to={`/reports/${report._id}`}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          title="View details"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No Medical Reports Yet"
                  description="Upload your first blood test, thyroid panel, or laboratory document to get started."
                  actionText="Upload First Report"
                  onAction={openUploadModal}
                  className="my-4 border-0"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets: Quick Actions & Guidance */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button
                onClick={openUploadModal}
                variant="outline"
                className="w-full justify-start text-sm h-11"
              >
                <Upload className="h-4 w-4 mr-2.5 text-primary-600" />
                Upload New Report
              </Button>
              <Link to="/compare" className="block">
                <Button variant="outline" className="w-full justify-start text-sm h-11">
                  <GitCompare className="h-4 w-4 mr-2.5 text-indigo-600" />
                  Compare Two Reports
                </Button>
              </Link>
              <Link to="/risk-assessment" className="block">
                <Button variant="outline" className="w-full justify-start text-sm h-11">
                  <Activity className="h-4 w-4 mr-2.5 text-teal-600" />
                  Clinical Risk Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Onboarding Guidance & Security Assurance */}
          <Card className="bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-sm">
                <ShieldCheck className="h-4 w-4" />
                Privacy &amp; Evidence Grounding
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Your files are stored in private local storage and are never made public.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Reference ranges and biomarker values reflect the printed report intervals.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Full ability to review and correct any extracted measurement manually.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Category Breakdown Card */}
          {stats && Object.values(stats.categoryCounts).some((v) => v > 0) && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Documents by Category</p>
                <div className="space-y-1.5">
                  {(Object.entries(stats.categoryCounts) as [string, number][])
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${CATEGORY_META[cat as keyof typeof CATEGORY_META]?.color ?? 'bg-muted text-foreground'}`}>
                          {getCategoryLabel(cat)}
                        </span>
                        <span className="font-semibold text-foreground">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
