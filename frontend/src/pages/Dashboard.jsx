import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  HeartPulse,
  Info,
  Sparkles,
  UploadCloud,
} from 'lucide-react'

function Dashboard() {
  return (
    <div className="space-y-7">

      {/* =========================================================
          TOP HEADER
      ========================================================= */}

      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600">
            <CalendarDays size={14} />
            <span>Wednesday, August 26</span>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Good morning 👋
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your health information, organized and explained clearly.
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* Notification */}
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-teal-200 hover:text-teal-600"
          >
            <Bell size={18} />

            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-teal-500" />
          </button>

          {/* Upload */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700"
          >
            <UploadCloud size={17} />
            Upload Report
          </button>

        </div>
      </header>


      {/* =========================================================
          HERO — REPORT INTELLIGENCE
      ========================================================= */}

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#087f78] via-[#0b9188] to-[#13a39a] p-7 text-white shadow-xl shadow-teal-900/10 md:p-9">

        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[45px] border-white/5" />

        <div className="pointer-events-none absolute -bottom-28 right-24 h-64 w-64 rounded-full border-[35px] border-white/5" />

        <div className="pointer-events-none absolute right-10 top-10 hidden h-24 w-24 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm lg:block" />

        <div className="relative z-10 max-w-3xl">

          {/* Label */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-teal-50 backdrop-blur-sm">
            <Sparkles size={13} />
            MEDICAL REPORT INTELLIGENCE
          </div>

          <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Turn your medical report
            <br />
            into understandable insights.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-teal-50 md:text-[15px]">
            Upload your medical report and MedExplain AI will organize
            the information, highlight important findings, and prepare
            it for personalized health analysis.
          </p>

          {/* Upload button */}
          <button
            type="button"
            className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-teal-700 shadow-lg transition hover:bg-teal-50"
          >
            <UploadCloud size={18} />

            Upload Medical Report

            <ArrowRight size={17} />
          </button>

          <p className="mt-4 text-[11px] text-teal-100">
            PDF, medical reports and supported documents
          </p>
        </div>

        {/* Visual element */}
        <div className="absolute bottom-8 right-10 hidden lg:block">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-[32px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">

            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15">
              <HeartPulse
                size={42}
                strokeWidth={1.5}
              />
            </div>

            <div className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-lg">
              <Sparkles size={18} />
            </div>

          </div>
        </div>

      </section>


      {/* =========================================================
          HEALTH OVERVIEW
      ========================================================= */}

      <section>

        <div className="mb-4 flex items-end justify-between">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Health Overview
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Your latest information extracted from reports
            </p>
          </div>

          <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
            No report analyzed yet
          </span>

        </div>


        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <HealthMetric
            title="Glucose"
            unit="mg/dL"
            description="Blood glucose"
          />

          <HealthMetric
            title="HbA1c"
            unit="%"
            description="Average blood sugar"
          />

          <HealthMetric
            title="Blood Pressure"
            unit="mmHg"
            description="Blood pressure"
          />

          <HealthMetric
            title="BMI"
            unit=""
            description="Body mass index"
          />

        </div>

      </section>


      {/* =========================================================
          MAIN DASHBOARD GRID
      ========================================================= */}

      <div className="grid gap-6 xl:grid-cols-5">

        {/* ---------------------------------------------------------
            RISK ASSESSMENT
        --------------------------------------------------------- */}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 xl:col-span-3">

          <div className="flex items-start justify-between">

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900">
                  Risk Assessment
                </h2>

                <div className="group relative">
                  <Info
                    size={14}
                    className="text-slate-300"
                  />
                </div>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Model-estimated risk based on compatible report data.
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <HeartPulse size={20} />
            </div>

          </div>


          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <RiskAssessmentCard
              title="Diabetes Risk"
              description="Diabetes risk prediction and AI explanation"
            />

            <RiskAssessmentCard
              title="Heart Disease Risk"
              description="Cardiovascular risk prediction and explanation"
            />

          </div>


          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                <Info size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">
                  How this works
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Risk analysis will use relevant values extracted from
                  your uploaded medical report. The prediction is an
                  AI-assisted estimate, not a medical diagnosis.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* ---------------------------------------------------------
            RECENT REPORTS
        --------------------------------------------------------- */}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 xl:col-span-2">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Recent Reports
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Your latest uploaded documents
              </p>
            </div>

            <FileText
              size={20}
              className="text-teal-600"
            />

          </div>


          {/* Empty state */}

          <div className="mt-6 flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <FileText size={20} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              No reports yet
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
              Upload your first medical report and your analysis
              history will appear here.
            </p>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
            >
              Upload your first report
              <ChevronRight size={14} />
            </button>

          </div>

        </section>

      </div>


      {/* =========================================================
          AI EXPLANATION PREVIEW
      ========================================================= */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">
                Explainable AI
              </p>

              <h2 className="mt-1 font-bold text-slate-900">
                Understand why the model made a prediction.
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
                MedExplain AI will show the important factors behind
                a risk prediction instead of presenting only a score.
              </p>
            </div>

          </div>


          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-600"
          >
            Learn how XAI works
            <ArrowRight size={14} />
          </button>

        </div>

      </section>


      {/* =========================================================
          FOOTER NOTE
      ========================================================= */}

      <div className="flex items-center justify-center gap-2 pb-2 text-[10px] text-slate-400">

        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />

        MedExplain AI provides educational health insights and
        does not replace professional medical advice.

      </div>

    </div>
  )
}


/* ===============================================================
   HEALTH METRIC CARD
================================================================ */

function HealthMetric({
  title,
  unit,
  description,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md hover:shadow-slate-200/40">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {description}
          </p>
        </div>

        <div className="h-2 w-2 rounded-full bg-slate-200 transition group-hover:bg-teal-400" />

      </div>


      <div className="mt-5 flex items-end gap-1">

        <span className="text-3xl font-bold tracking-tight text-slate-300">
          —
        </span>

        {unit && (
          <span className="mb-1 text-[10px] text-slate-400">
            {unit}
          </span>
        )}

      </div>


      <div className="mt-3 text-[10px] font-medium text-slate-400">
        Awaiting report data
      </div>

    </div>
  )
}


/* ===============================================================
   RISK CARD
================================================================ */

function RiskAssessmentCard({
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 transition hover:border-teal-100 hover:bg-teal-50/30">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-sm font-bold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            {description}
          </p>

        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-300 shadow-sm">
          <HeartPulse size={16} />
        </div>

      </div>


      <div className="mt-5 flex items-center justify-between">

        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[9px] font-bold tracking-wide text-slate-500">
          NOT ANALYZED
        </span>

        <ArrowRight
          size={15}
          className="text-slate-300"
        />

      </div>

    </div>
  )
}

export default Dashboard