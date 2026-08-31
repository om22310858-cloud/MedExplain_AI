import { useEffect, useState } from 'react'

import {
  Bell,
  Check,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react'


function Settings() {

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('medexplain-theme') === 'dark'
  })


  useEffect(() => {

    if (darkMode) {

      document.documentElement.classList.add('dark')

      localStorage.setItem(
        'medexplain-theme',
        'dark'
      )

    } else {

      document.documentElement.classList.remove('dark')

      localStorage.setItem(
        'medexplain-theme',
        'light'
      )

    }

  }, [darkMode])


  return (
    <div className="mx-auto max-w-5xl space-y-7">

      <header>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          <Palette size={16} />
          SETTINGS
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Customize your MedExplain AI experience.
        </p>

      </header>


      {/* APPEARANCE */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
            <Palette size={19} />
          </div>

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              Appearance
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Choose how MedExplain AI looks.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          {/* LIGHT */}

          <button
            type="button"
            onClick={() => setDarkMode(false)}

            className={`
              rounded-2xl
              border
              p-5
              text-left
              transition

              ${
                !darkMode
                  ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20'
                  : 'border-slate-200 dark:border-slate-700'
              }
            `}
          >

            <div className="flex items-center justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm dark:bg-slate-800">
                <Sun size={19} />
              </div>

              {!darkMode && (
                <Check
                  size={19}
                  className="text-teal-500"
                />
              )}

            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
              Light mode
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Calm and bright healthcare interface.
            </p>

          </button>


          {/* DARK */}

          <button
            type="button"
            onClick={() => setDarkMode(true)}

            className={`
              rounded-2xl
              border
              p-5
              text-left
              transition

              ${
                darkMode
                  ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20'
                  : 'border-slate-200 dark:border-slate-700'
              }
            `}
          >

            <div className="flex items-center justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                <Moon size={19} />
              </div>

              {darkMode && (
                <Check
                  size={19}
                  className="text-teal-500"
                />
              )}

            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
              Dark mode
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Comfortable low-light interface.
            </p>

          </button>

        </div>

      </section>


      {/* NOTIFICATIONS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            <Bell size={19} />
          </div>

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              Notifications
            </h2>

            <p className="text-xs text-slate-400">
              Notification controls will be connected later.
            </p>

          </div>

        </div>


        <SettingRow
          title="Analysis completed"
          description="Notify when a report has been processed."
        />

        <SettingRow
          title="Risk assessment ready"
          description="Notify when model results are available."
        />

      </section>


      {/* PRIVACY */}

      <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-6 dark:border-teal-900/40 dark:bg-teal-950/20">

        <div className="flex items-start gap-3">

          <ShieldCheck
            size={19}
            className="mt-0.5 text-teal-600"
          />

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              Privacy and security
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Secure authentication, report storage and user
              permissions will be added during backend development.
            </p>

          </div>

        </div>

      </section>


      {/* ACCOUNT */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <UserRound size={19} />
          </div>

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              Account
            </h2>

            <p className="text-xs text-slate-400">
              Manage your profile information.
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}


/* ============================================================
   SETTING ROW
============================================================ */

function SettingRow({
  title,
  description,
}) {

  return (
    <div className="mt-5 flex items-center justify-between gap-5 border-t border-slate-100 pt-5 dark:border-slate-800">

      <div>

        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>

      </div>


      <div className="h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-700">

        <div className="ml-1 mt-1 h-4 w-4 rounded-full bg-white shadow-sm dark:bg-slate-400" />

      </div>

    </div>
  )
}


export default Settings