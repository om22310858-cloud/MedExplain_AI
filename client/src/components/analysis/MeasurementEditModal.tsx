import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { ExtractedMeasurement, ResultFlag } from '../../types/index.js';
import { reportService } from '../../services/reportService.js';

interface MeasurementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  measurement: ExtractedMeasurement | null;
  onSaved: (updated: ExtractedMeasurement) => void;
}

export const MeasurementEditModal: React.FC<MeasurementEditModalProps> = ({
  isOpen,
  onClose,
  reportId,
  measurement,
  onSaved,
}) => {
  const isCreate = !measurement;
  const [testName, setTestName] = useState('');
  const [rawValue, setRawValue] = useState('');
  const [numericValue, setNumericValue] = useState<string>('');
  const [unit, setUnit] = useState('');
  const [referenceRangeText, setReferenceRangeText] = useState('');
  const [referenceLow, setReferenceLow] = useState<string>('');
  const [referenceHigh, setReferenceHigh] = useState<string>('');
  const [resultFlag, setResultFlag] = useState<ResultFlag>('unknown');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (measurement) {
      setTestName(measurement.testName || '');
      setRawValue(measurement.rawValue || '');
      setNumericValue(measurement.numericValue !== null && measurement.numericValue !== undefined ? String(measurement.numericValue) : '');
      setUnit(measurement.unit || '');
      setReferenceRangeText(measurement.referenceRangeText || '');
      setReferenceLow(measurement.referenceLow !== null && measurement.referenceLow !== undefined ? String(measurement.referenceLow) : '');
      setReferenceHigh(measurement.referenceHigh !== null && measurement.referenceHigh !== undefined ? String(measurement.referenceHigh) : '');
      setResultFlag(measurement.resultFlag || 'unknown');
      setNotes(measurement.notes || '');
      setError(null);
    } else if (isOpen) {
      setTestName('');
      setRawValue('');
      setNumericValue('');
      setUnit('');
      setReferenceRangeText('');
      setReferenceLow('');
      setReferenceHigh('');
      setResultFlag('unknown');
      setNotes('');
      setError(null);
    }
  }, [measurement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        testName: testName.trim(),
        originalTestName: testName.trim(),
        rawValue: rawValue.trim(),
        numericValue: numericValue.trim() !== '' ? Number(numericValue) : null,
        unit: unit.trim() || null,
        referenceRangeText: referenceRangeText.trim() || null,
        referenceLow: referenceLow.trim() !== '' ? Number(referenceLow) : null,
        referenceHigh: referenceHigh.trim() !== '' ? Number(referenceHigh) : null,
        resultFlag,
        notes: notes.trim() || undefined,
      };
      const updated = measurement
        ? await reportService.updateMeasurement(measurement.reportId, measurement._id, payload)
        : await reportService.addMeasurement(reportId, payload);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.customMessage || 'Failed to save measurement correction.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Enter Laboratory Measurement' : 'Correct Laboratory Measurement'}
      description={
        measurement
          ? `Original extraction: "${measurement.originalTestName}" (${measurement.rawValue})`
          : 'Manually enter a value from the original document. Do not invent values that are not printed on the report.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Test Name"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Raw Printed Value"
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            required
          />
          <Input
            label="Parsed Numeric Value"
            type="number"
            step="any"
            value={numericValue}
            placeholder="e.g. 14.2 (or leave empty if non-numeric)"
            onChange={(e) => setNumericValue(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Unit"
            value={unit}
            placeholder="e.g. mg/dL, g/dL, %"
            onChange={(e) => setUnit(e.target.value)}
          />
          <Select
            label="Clinical Result Flag"
            value={resultFlag}
            onChange={(e) => setResultFlag(e.target.value as ResultFlag)}
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="low">Low</option>
            <option value="abnormal">Abnormal</option>
            <option value="unknown">Unknown / Not flagged</option>
          </Select>
        </div>

        <Input
          label="Reference Range Text"
          value={referenceRangeText}
          placeholder="e.g. 70 - 99 mg/dL"
          onChange={(e) => setReferenceRangeText(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Reference Low"
            type="number"
            step="any"
            value={referenceLow}
            placeholder="e.g. 70"
            onChange={(e) => setReferenceLow(e.target.value)}
          />
          <Input
            label="Reference High"
            type="number"
            step="any"
            value={referenceHigh}
            placeholder="e.g. 99"
            onChange={(e) => setReferenceHigh(e.target.value)}
          />
        </div>

        <div className="p-2.5 rounded-lg bg-muted/60 text-[11px] text-muted-foreground">
          {isCreate
            ? 'This value will be stored as user-entered, distinct from automatically extracted measurements.'
            : 'Saving this correction will update its provenance to user-corrected and mark it as confirmed.'}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            {isCreate ? 'Save Measurement' : 'Save Correction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
