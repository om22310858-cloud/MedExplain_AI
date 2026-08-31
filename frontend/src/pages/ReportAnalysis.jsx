import { useLocation, useNavigate } from 'react-router-dom'

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
  Layers3,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'

function ReportAnalysis() {
  const location = useLocation()
  const navigate = useNavigate()

  /* =========================================================
     CURRENT REPORT INFORMATION

     For now the Upload page sends the file metadata here.

     Later this section will receive actual processed data
     from the backend.
  ========================================================= */

  const fileName =
    location.state?.fileName || 'Medical Report'

  const fileSize =
    location.state?.fileSize || null

  const fileType =
    location.state?.fileType || 'Unknown'

  const formattedFileSize = fileSize
    ? `${Math.max(1, Math.round(fileSize / 1024))} KB`
    : '—'


  /* =========================================================
     FUTURE REPORT DATA

     IMPORTANT:

     Do NOT put fake medical values here.

     These will eventually come from:

     Medical Report
          ↓
     OCR / Document Parser
          ↓
     Structured Medical Data
          ↓
     Frontend
  ========================================================= */

  const extractedValues = [
    {
      label: 'Glucose',
      unit: 'mg/dL',
    },
    {
      label: 'HbA1c',
      unit: '%',
    },
    {
      label: 'Blood Pressure',
      unit: 'mmHg',
    },
    {
      label: 'BMI',
      unit: '',
    },
    {
      label: 'Age',
      unit: 'years',
    },
    {
      label: 'Cholesterol',
      unit: 'mg/dL',
    },
  ]


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToRiskAssessment = () => {
    navigate('/risk-assessment', {
      state: {
        fileName,
        fileSize,
        fileType,
      },
    })
  }


  return (
    <div className="mx-auto max-w-6xl space-y-7">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header>

        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-teal-600"
        >
          <ArrowLeft size={15} />
          Back to reports
        </button>


        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <div className="flex items-center gap-2">

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <FileText size={16} />
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600">
                Medical Report Intelligence
              </span>

            </div>


            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Medical Report Overview
            </h1>


            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review information identified from your medical
              report before continuing to health risk assessment.
            </p>

          </div>


          {/* Report status */}

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 md:self-auto">

            <CheckCircle2 size={15} />

            Report ready

          </div>

        </div>

      </header>


      {/* =====================================================
          REPORT INFORMATION
      ===================================================== */}

      <section className="grid gap-5 lg:grid-cols-3">

        {/* -----------------------------------------------------
            CURRENT REPORT
        ----------------------------------------------------- */}

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <FileText size={21} />
              </div>


              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Current report
                </p>

                <h2
                  className="mt-1 max-w-[210px] truncate text-sm font-bold text-slate-800"
                  title={fileName}
                >
                  {fileName}
                </h2>

              </div>

            </div>

          </div>


          <div className="mt-6 space-y-3">

            <InfoRow
              label="Document type"
              value="Medical report"
            />

            <InfoRow
              label="File size"
              value={formattedFileSize}
            />

            <InfoRow
              label="Format"
              value={
                fileType.includes('pdf')
                  ? 'PDF'
                  : fileType.includes('image')
                    ? 'Image'
                    : 'Document'
              }
            />

            <InfoRow
              label="Status"
              value="Ready"
            />

          </div>

        </div>


        {/* -----------------------------------------------------
            REPORT PROCESSING
        ----------------------------------------------------- */}

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 lg:col-span-2">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Sparkles size={19} />
            </div>


            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-500">
                Report intelligence
              </p>

              <h2 className="mt-1 text-base font-bold text-slate-900">
                Turning your report into understandable information
              </h2>

            </div>

          </div>


          {/* Processing stages */}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            <ProcessingStep
              icon={<FileText size={16} />}
              title="Report received"
              description="Your document has been selected."
              complete
            />

            <ProcessingStep
              icon={<Layers3 size={16} />}
              title="Information extraction"
              description="Medical values will be identified."
            />

            <ProcessingStep
              icon={<Sparkles size={16} />}
              title="AI explanation"
              description="Important findings will be explained."
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          REPORT SUMMARY
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <ClipboardList size={19} />
          </div>


          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-600">
              Report summary
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Your report at a glance
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-400">
              MedExplain AI will organize information from the
              uploaded report into a clearer structure. The summary
              will be generated from the actual report content after
              the extraction pipeline is connected.
            </p>

          </div>

        </div>


        <div className="mt-6 rounded-xl bg-slate-50 p-5">

          <div className="flex items-center gap-3">

            <div className="h-2 w-2 rounded-full bg-slate-300" />

            <p className="text-xs font-semibold text-slate-500">
              Waiting for report extraction
            </p>

          </div>

          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            No medical values are displayed until they are
            extracted from the uploaded report.
          </p>

        </div>

      </section>


      {/* =====================================================
          EXTRACTED HEALTH INFORMATION
      ===================================================== */}

      <section>

        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

          <div>

            <div className="flex items-center gap-2">

              <Activity
                size={18}
                className="text-teal-600"
              />

              <h2 className="text-lg font-bold text-slate-900">
                Extracted Health Information
              </h2>

            </div>


            <p className="mt-1 text-xs text-slate-400">
              Relevant health values identified from your reports.
            </p>

          </div>


          <span className="text-[10px] font-semibold text-slate-400">
            Extraction pending
          </span>

        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {extractedValues.map((item) => (
            <ExtractedValue
              key={item.label}
              label={item.label}
              unit={item.unit}
            />
          ))}

        </div>

      </section>


      {/* =====================================================
          IMPORTANT FINDINGS
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertCircle size={19} />
          </div>


          <div>

            <h2 className="font-bold text-slate-900">
              Important Findings
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Findings identified from your medical reports will
              appear here after processing.
            </p>

          </div>

        </div>


        <div className="mt-5 grid gap-4 md:grid-cols-2">

          <FindingCard
            type="attention"
            title="Potentially important findings"
            description="Values or findings that may require additional attention will be highlighted here."
          />

          <FindingCard
            type="normal"
            title="Other findings"
            description="Relevant information that does not require special attention will also be organized here."
          />

        </div>

      </section>


      {/* =====================================================
          MULTI-REPORT ARCHITECTURE
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            <Layers3 size={19} />
          </div>


          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Medical history
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Multiple reports, one health picture
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-400">
              MedExplain AI is designed to support multiple medical
              reports over time. Future versions can compare
              information across reports and organize changes in
              health values.
            </p>

          </div>

        </div>


        <div className="mt-5 grid gap-3 md:grid-cols-3">

          <HistoryFeature
            title="Store reports"
            description="Keep previously uploaded medical reports organized."
          />

          <HistoryFeature
            title="Track changes"
            description="Compare extracted health information across different reports."
          />

          <HistoryFeature
            title="Build health history"
            description="Create a clearer timeline of important health information."
          />

        </div>

      </section>


      {/* =====================================================
          EXPLAINABLE AI
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-white p-6 md:p-7">

        <div className="flex flex-col gap-5 md:flex-row md:items-start">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Sparkles size={22} />
          </div>


          <div className="flex-1">

            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-violet-500">
              Explainable Health AI
            </p>


            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Understand your results, not just the numbers.
            </h2>


            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              MedExplain AI will explain important health
              information in simple language and, where a risk
              model is used, explain the factors influencing its
              prediction.
            </p>


            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              <ExplanationPoint
                title="What?"
                text="Understand what a health value or finding means."
              />

              <ExplanationPoint
                title="Why?"
                text="Understand why the information may matter."
              />

              <ExplanationPoint
                title="Next?"
                text="Understand what you may want to discuss with a healthcare professional."
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          RISK ASSESSMENT
      ===================================================== */}

      <section className="rounded-2xl bg-slate-900 p-6 text-white md:p-7">

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-2 text-teal-300">

              <Sparkles size={16} />

              <span className="text-[10px] font-bold uppercase tracking-[0.17em]">
                Next step
              </span>

            </div>


            <h2 className="mt-2 text-xl font-bold">
              Continue to Risk Assessment
            </h2>


            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
              Compatible information extracted from your report
              can be used by the available health risk models.
              Diabetes and heart disease assessment are currently
              being developed first.
            </p>

          </div>


          <button
            type="button"
            onClick={goToRiskAssessment}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-400"
          >
            Continue to Risk Assessment
            <ArrowRight size={17} />
          </button>

        </div>

      </section>


      {/* =====================================================
          DISCLAIMER
      ===================================================== */}

      <div className="flex items-start justify-center gap-2 pb-4 text-center text-[10px] leading-5 text-slate-400">

        <Info
          size={13}
          className="mt-0.5 shrink-0"
        />

        <span>
          MedExplain AI provides educational health information
          and AI-assisted estimates. It does not provide a medical
          diagnosis or replace professional medical advice.
        </span>

      </div>

    </div>
  )
}


/* =============================================================
   INFO ROW
============================================================= */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">

      <span className="text-xs text-slate-400">
        {label}
      </span>


      <span
        className="max-w-[180px] truncate text-xs font-semibold text-slate-700"
        title={value}
      >
        {value}
      </span>

    </div>
  )
}


/* =============================================================
   PROCESSING STEP
============================================================= */

function ProcessingStep({
  icon,
  title,
  description,
  complete = false,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        complete
          ? 'border-teal-100 bg-teal-50/40'
          : 'border-slate-100 bg-slate-50/60'
      }`}
    >

      <div className="flex items-center gap-2">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            complete
              ? 'bg-teal-100 text-teal-600'
              : 'bg-white text-slate-400'
          }`}
        >
          {complete ? (
            <CheckCircle2 size={15} />
          ) : (
            icon
          )}
        </div>


        {complete && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-teal-600">
            Ready
          </span>
        )}

      </div>


      <h3 className="mt-4 text-xs font-bold text-slate-800">
        {title}
      </h3>


      <p className="mt-1 text-[10px] leading-5 text-slate-400">
        {description}
      </p>

    </div>
  )
}


/* =============================================================
   EXTRACTED VALUE
============================================================= */

function ExtractedValue({
  label,
  unit,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md hover:shadow-slate-200/40">

      <div className="flex items-start justify-between">

        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>


        <span className="h-2 w-2 rounded-full bg-slate-200" />

      </div>


      <div className="mt-5 flex items-end gap-1">

        <span className="text-3xl font-bold text-slate-300">
          —
        </span>


        {unit && (
          <span className="mb-1 text-[10px] text-slate-400">
            {unit}
          </span>
        )}

      </div>


      <p className="mt-3 text-[10px] text-slate-400">
        Awaiting extracted value
      </p>

    </div>
  )
}


/* =============================================================
   FINDING CARD
============================================================= */

function FindingCard({
  type,
  title,
  description,
}) {
  const isAttention = type === 'attention'

  return (
    <div
      className={`rounded-xl border p-5 ${
        isAttention
          ? 'border-amber-100 bg-amber-50/40'
          : 'border-slate-100 bg-slate-50'
      }`}
    >

      <div className="flex items-center gap-2">

        <span
          className={`h-2 w-2 rounded-full ${
            isAttention
              ? 'bg-amber-400'
              : 'bg-slate-300'
          }`}
        />


        <p className="text-xs font-semibold text-slate-700">
          {title}
        </p>

      </div>


      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        {description}
      </p>

    </div>
  )
}


/* =============================================================
   HISTORY FEATURE
============================================================= */

function HistoryFeature({
  title,
  description,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">

      <h3 className="text-xs font-bold text-slate-700">
        {title}
      </h3>


      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        {description}
      </p>

    </div>
  )
}


/* =============================================================
   EXPLANATION POINT
============================================================= */

function ExplanationPoint({
  title,
  text,
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white/70 p-4 transition hover:border-violet-200">

      <span className="text-xs font-bold text-violet-600">
        {title}
      </span>


      <p className="mt-1 text-[11px] leading-5 text-slate-400">
        {text}
      </p>

    </div>
  )
}


export default ReportAnalysis