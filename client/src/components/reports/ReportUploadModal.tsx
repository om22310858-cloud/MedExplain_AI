import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { Alert } from '../common/Alert.js';
import { reportService } from '../../services/reportService.js';
import { UploadCloud, File, AlertCircle, CheckCircle2, FlaskConical, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReportCategory, DocumentType, CATEGORY_META } from '../../types/index.js';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReportUploadModal: React.FC<ReportUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('general');
  const [documentType, setDocumentType] = useState<DocumentType>('lab_report');
  const [reportDate, setReportDate] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setCategory('general');
    setDocumentType('lab_report');
    setReportDate('');
    setUserNotes('');
    setAutoAnalyze(true);
    setIsUploading(false);
    setUploadProgress('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        // Pre-fill clean title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF document or image to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress('Uploading file to private storage...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim() || selectedFile.name);
      formData.append('category', category);
      formData.append('documentType', documentType);
      if (reportDate) formData.append('reportDate', reportDate);
      if (userNotes) formData.append('userNotes', userNotes);

      const createdReport = await reportService.uploadReport(formData);

      if (autoAnalyze && documentType === 'lab_report') {
        setUploadProgress('Extracting text and running structured AI analysis...');
        try {
          await reportService.triggerAnalysis(createdReport._id);
        } catch (analysisErr: any) {
          console.warn('Auto-analysis notice:', analysisErr);
          // Report was created successfully; user can review unconfigured/failed state on detail page
        }
      }

      setUploadProgress('Report stored successfully!');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
        navigate(`/reports/${createdReport._id}`);
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.customMessage || 'Failed to upload report. Please check file format and size.');
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Medical Document"
      description="Upload clinical laboratory results, prescriptions, or medical records."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" title="Upload Failed">
            {errorMessage}
          </Alert>
        )}

        {/* Drag and drop box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-primary bg-primary-50/50 dark:bg-primary-950/20'
              : selectedFile
              ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2 text-teal-700 dark:text-teal-300">
              <CheckCircle2 className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              <div className="text-sm font-semibold truncate max-w-xs">{selectedFile.name}</div>
              <div className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary-50 dark:bg-primary-950/80 p-3 text-primary-600 dark:text-primary-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Click to browse or drag and drop your report
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PDF documents or PNG/JPEG images up to 10 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Report Title"
            placeholder="e.g. Annual Comprehensive Metabolic Panel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Select
            label="Clinical Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
          >
            <option value="general">Other / General Report</option>
            <option value="thyroid">Thyroid Panel</option>
            <option value="cardiovascular">Heart &amp; Cardiovascular / Lipids</option>
            <option value="blood_cbc">Blood Tests / CBC Panel</option>
            <option value="diabetes">Diabetes &amp; Glycemic Tests</option>
            <option value="kidney">Kidney &amp; Renal Function</option>
            <option value="stroke">Stroke-Related / Coagulation</option>
          </Select>
        </div>

        {/* Document Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Document Classification"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          >
            <option value="lab_report">Laboratory Test Report</option>
            <option value="prescription">Prescription</option>
            <option value="doctor_notes">Doctor Consultation Notes</option>
            <option value="discharge_summary">Hospital Discharge Summary</option>
            <option value="imaging">Imaging / Radiology Report</option>
            <option value="other">Other Medical Document</option>
          </Select>

          <Input
            type="date"
            label="Specimen / Report Date (Optional)"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Personal Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="e.g. Fasting sample taken in morning, ordered by Dr. Sharma"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* AI Analysis Option */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="autoAnalyze"
            checked={autoAnalyze}
            onChange={(e) => setAutoAnalyze(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary"
          />
          <label htmlFor="autoAnalyze" className="text-sm text-foreground select-none cursor-pointer">
            Extract structured measurements and generate educational explanations
          </label>
        </div>

        {uploadProgress && (
          <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full shrink-0" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isUploading}>
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};
