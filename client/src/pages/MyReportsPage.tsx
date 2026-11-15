import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { reportService } from '../services/reportService.js';
import { MedicalReport, ReportCategory, DocumentType, CATEGORY_META } from '../types/index.js';
import { Card, CardContent } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Badge } from '../components/common/Badge.js';
import { Alert } from '../components/common/Alert.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import {
  FileText,
  Search,
  Upload,
  Download,
  Trash2,
  Calendar,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

export const MyReportsPage: React.FC = () => {
  const { openUploadModal } = useOutletContext<{ openUploadModal: () => void }>();

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'reportDate' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Deletion modal state
  const [reportToDelete, setReportToDelete] = useState<MedicalReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await reportService.getReports({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        documentType: selectedDocType !== 'all' ? selectedDocType : undefined,
        search: searchTerm.trim() || undefined,
        sortBy,
        sortOrder,
      });
      setReports(data.reports);
    } catch (err: any) {
      setLoadError(err.customMessage || 'Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCategory, selectedDocType, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      await reportService.deleteReport(reportToDelete._id);
      setReports((prev) => prev.filter((r) => r._id !== reportToDelete._id));
      setReportToDelete(null);
    } catch (err) {
      console.error('Failed to delete report', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (report: MedicalReport) => {
    if (report.analysisStatus === 'completed') {
      return <Badge variant="success">Analyzed</Badge>;
    }
    if (report.analysisStatus === 'unavailable') {
      return <Badge variant="warning">Manual / Stored</Badge>;
    }
    if (report.analysisStatus === 'pending') {
      return <Badge variant="info">Analyzing...</Badge>;
    }
    if (report.analysisStatus === 'failed') {
      return <Badge variant="destructive">Needs Review</Badge>;
    }
    return <Badge variant="outline">Uploaded</Badge>;
  };

  const getCategoryLabel = (cat: ReportCategory) => {
    return CATEGORY_META[cat]?.label ?? cat;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Medical Records
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your stored laboratory results, prescriptions, and clinical notes
          </p>
        </div>
        <Button onClick={openUploadModal} variant="primary" size="md">
          <Upload className="h-4 w-4 mr-2" />
          Upload New Document
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, personal notes, or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" variant="secondary" size="md">
              Search
            </Button>
          </form>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/60">
            <Select
              label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="blood_cbc">Blood Tests / CBC</option>
              <option value="cardiovascular">Heart &amp; Cardiovascular</option>
              <option value="diabetes">Diabetes &amp; Glycemic</option>
              <option value="kidney">Kidney / Renal</option>
              <option value="thyroid">Thyroid</option>
              <option value="stroke">Stroke-Related / Coagulation</option>
              <option value="general">General / Other</option>
            </Select>

            <Select
              label="Document Classification"
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
            >
              <option value="all">All Document Types</option>
              <option value="lab_report">Laboratory Test Report</option>
              <option value="prescription">Prescription</option>
              <option value="doctor_notes">Doctor Consultation Notes</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="imaging">Imaging / Radiology</option>
              <option value="other">Other Document</option>
            </Select>

            <Select
              label="Sort By"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [any, any];
                setSortBy(sb);
                setSortOrder(so);
              }}
            >
              <option value="createdAt-desc">Recently Uploaded First</option>
              <option value="createdAt-asc">Oldest Uploaded First</option>
              <option value="reportDate-desc">Specimen Date (Newest)</option>
              <option value="reportDate-asc">Specimen Date (Oldest)</option>
              <option value="title-asc">Title (A - Z)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loadError && (
        <Alert variant="destructive" title="Unable to load reports">
          {loadError}
        </Alert>
      )}

      {/* Reports Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card
              key={report._id}
              className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    {getCategoryLabel(report.category)}
                  </Badge>
                  {getStatusBadge(report)}
                </div>

                <div>
                  <Link
                    to={`/reports/${report._id}`}
                    className="font-semibold text-base text-foreground hover:text-primary-600 line-clamp-1 block"
                  >
                    {report.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {report.userNotes || report.originalFilename}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {report.reportDate
                      ? format(new Date(report.reportDate), 'MMM d, yyyy')
                      : format(new Date(report.createdAt), 'MMM d, yyyy')}
                  </span>
                  <span>•</span>
                  <span>{(report.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20 rounded-b-xl text-xs">
                <Link
                  to={`/reports/${report._id}`}
                  className="font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View Details <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      reportService.downloadReport(report._id, report.originalFilename)
                    }
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                    title="Download original file"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setReportToDelete(report)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10"
                    title="Delete report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No Matching Reports Found"
          description={
            searchTerm || selectedCategory !== 'all' || selectedDocType !== 'all'
              ? 'Try modifying your search query or filter options.'
              : 'You have not uploaded any medical documents yet.'
          }
          actionText="Upload Medical Document"
          onAction={openUploadModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        title="Confirm Report Deletion"
        description="Are you sure you want to permanently delete this report?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deleting <strong className="text-foreground">"{reportToDelete?.title}"</strong> will
            permanently remove the original file, its extracted measurements, AI explanations, and
            associated risk assessments. This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
