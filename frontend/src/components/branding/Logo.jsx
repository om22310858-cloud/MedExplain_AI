import { Activity } from 'lucide-react'

function Logo({ collapsed = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
        <Activity size={21} strokeWidth={2.4} />
      </div>

      {!collapsed && (
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold tracking-tight text-slate-900">
            MedExplain <span className="text-teal-600">AI</span>
          </div>

          <div className="mt-0.5 text-[9px] font-semibold tracking-[0.16em] text-slate-400">
            UNDERSTAND YOUR HEALTH
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo