import {
  Archive,
  Download,
  FileText,
  FolderOpen,
  Info,
  LockKeyhole,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'


function HealthRecords() {

  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-6xl space-y-7">

      <header>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
          <ShieldCheck size={16} />
          HEALTH RECORDS
        </div>

        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Your Health Records
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              A central place for the medical documents you
              upload to MedExplain AI.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 hover:bg-teal-400"
          >
            <Upload size={17} />
            Upload Record
          </button>

        </div>

      </header>


      {/* PRIVACY */}

      <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 dark:border-teal-900/40 dark:bg-teal-950/20">

        <div className="flex items-start gap-3">

          <LockKeyhole
            size={19}
            className="mt-0.5 shrink-0 text-teal-600"
          />

          <div>

            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Your records stay organized
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Secure storage and authentication will be connected
              when the backend is implemented.
            </p>

          </div>

        </div>

      </section>


      {/* SEARCH */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-center gap-3">

          <Search
            size={18}
            className="text-slate-400"
          />

          <input
            type="text"
            placeholder="Search your records..."
            className="
              w-full
              bg-transparent
              text-sm
              text-slate-700
              outline-none
              placeholder:text-slate-300
              dark:text-slate-200
            "
          />

        </div>

      </section>


      {/* EMPTY STATE */}

      <section className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-800/40">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm dark:bg-slate-900">
            <FolderOpen size={27} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-800 dark:text-white">
            No health records yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
            Upload your first medical report and it will be
            available here after processing.
          </p>

          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-xs font-bold text-white hover:bg-teal-400"
          >
            <Upload size={15} />
            Upload first report
          </button>

        </div>

      </section>


      {/* FUTURE */}

      <section className="grid gap-4 md:grid-cols-3">

        <InfoCard
          icon={<FileText size={18} />}
          title="Medical reports"
          text="Store and organize uploaded reports."
        />

        <InfoCard
          icon={<Archive size={18} />}
          title="Analysis history"
          text="Keep track of previous report analyses."
        />

        <InfoCard
          icon={<Download size={18} />}
          title="Export"
          text="Future reports can be exported as summaries."
        />

      </section>


      <div className="flex items-center justify-center gap-2 pb-4 text-center text-[10px] text-slate-400">

        <Info size={13} />

        Secure backend storage will be implemented later.

      </div>

    </div>
  )
}


function InfoCard({
  icon,
  title,
  text,
}) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {text}
      </p>

    </div>
  )
}


export default HealthRecords