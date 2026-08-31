import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  History,
  Info,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function HealthHistory() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-6xl space-y-7">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header>

        <div className="flex items-center gap-2 text-xs font-semibold text-teal-600">
          <History size={16} />
          HEALTH HISTORY
        </div>

        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Your Health History
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Keep track of information extracted from your medical
              reports and understand how your health information
              changes over time.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-400"
          >
            <FileText size={17} />
            Upload New Report
          </button>

        </div>

      </header>


      {/* =====================================================
          OVERVIEW CARDS
      ===================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <HistoryStat
          icon={<FileText size={18} />}
          label="Reports"
          value="—"
          description="Reports analyzed"
        />

        <HistoryStat
          icon={<Activity size={18} />}
          label="Health Values"
          value="—"
          description="Values extracted"
        />

        <HistoryStat
          icon={<TrendingUp size={18} />}
          label="Trends"
          value="—"
          description="Health trends available"
        />

        <HistoryStat
          icon={<CalendarDays size={18} />}
          label="Last Update"
          value="—"
          description="Awaiting report data"
        />

      </section>


      {/* =====================================================
          HEALTH TIMELINE
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Clock3 size={19} />
          </div>

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-600">
              Timeline
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Health journey
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Your analyzed reports and important health information
              will appear here chronologically.
            </p>

          </div>

        </div>


        {/* Empty timeline */}

        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
            <History size={24} />
          </div>

          <h3 className="mt-5 text-sm font-bold text-slate-700">
            Your health timeline will appear here
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
            Upload and analyze your first medical report to start
            building your health history.
          </p>

          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-teal-600 transition hover:text-teal-700"
          >
            Upload your first report
            <ArrowRight size={15} />
          </button>

        </div>

      </section>


      {/* =====================================================
          HEALTH TRENDS
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <TrendingUp size={19} />
            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">
                Health trends
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Track changes over time
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Compare extracted health values across multiple
                reports.
              </p>

            </div>

          </div>

        </div>


        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <TrendCard
            title="Glucose"
            unit="mg/dL"
          />

          <TrendCard
            title="HbA1c"
            unit="%"
          />

          <TrendCard
            title="Blood Pressure"
            unit="mmHg"
          />

          <TrendCard
            title="BMI"
            unit=""
          />

        </div>

      </section>


      {/* =====================================================
          REPORT HISTORY
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <FileText
                size={18}
                className="text-teal-600"
              />

              <h2 className="text-lg font-bold text-slate-900">
                Report History
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-400">
              Previously analyzed medical reports.
            </p>

          </div>

        </div>


        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">

          <FileText
            size={25}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-sm font-bold text-slate-700">
            No analyzed reports yet
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            Your reports will appear here after they are uploaded
            and processed.
          </p>

        </div>

      </section>


      {/* =====================================================
          FUTURE MULTI-REPORT FEATURE
      ===================================================== */}

      <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
            <Activity size={19} />
          </div>

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-600">
              Future health intelligence
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Build a complete health picture
            </h2>

            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
              As more reports are analyzed, MedExplain AI can
              organize extracted information into a longitudinal
              health history. This can help visualize changes in
              important health values over time.
            </p>

          </div>

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
          Health history features are intended to organize
          educational health information and do not replace
          professional medical advice.
        </span>

      </div>

    </div>
  )
}


/* =============================================================
   STAT CARD
============================================================= */

function HistoryStat({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
          {icon}
        </div>

        <span className="h-2 w-2 rounded-full bg-slate-200" />

      </div>

      <p className="mt-5 text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-300">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </div>
  )
}


/* =============================================================
   TREND CARD
============================================================= */

function TrendCard({
  title,
  unit,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-xs font-bold text-slate-700">
            {title}
          </h3>

          <p className="mt-1 text-[10px] text-slate-400">
            {unit || 'Health measure'}
          </p>

        </div>

        <span className="text-[10px] font-semibold text-slate-300">
          No data
        </span>

      </div>


      {/* Simple visual placeholder for future chart */}

      <div className="mt-6 flex h-16 items-end gap-2">

        {[35, 50, 42, 62, 48, 70, 55].map(
          (height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-md bg-slate-200/70"
              style={{ height: `${height}%` }}
            />
          )
        )}

      </div>

      <p className="mt-3 text-[10px] text-slate-400">
        Trend visualization will appear after multiple reports
        are analyzed.
      </p>

    </div>
  )
}


export default HealthHistory