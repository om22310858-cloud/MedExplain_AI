import {
  Activity,
  CalendarDays,
  Edit3,
  HeartPulse,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'


function Profile() {

  return (
    <div className="mx-auto max-w-5xl space-y-7">

      <header>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
          <UserRound size={16} />
          PROFILE
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage your account information and health preferences.
        </p>

      </header>


      {/* PROFILE HERO */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-teal-100 text-3xl font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            S
          </div>


          <div className="flex-1">

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                User Profile
              </h2>

              <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
                HEALTH ACCOUNT
              </span>

            </div>

            <p className="mt-2 text-sm text-slate-400">
              Your personal MedExplain AI account
            </p>

          </div>


          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Edit3 size={15} />
            Edit Profile
          </button>

        </div>

      </section>


      {/* DETAILS */}

      <section className="grid gap-5 md:grid-cols-2">

        <ProfileField
          icon={<UserRound size={17} />}
          label="Name"
          value="User Profile"
        />

        <ProfileField
          icon={<Mail size={17} />}
          label="Email"
          value="Not connected"
        />

        <ProfileField
          icon={<CalendarDays size={17} />}
          label="Date of birth"
          value="Not provided"
        />

        <ProfileField
          icon={<HeartPulse size={17} />}
          label="Health profile"
          value="Not configured"
        />

      </section>


      {/* HEALTH PROFILE */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30">
            <Activity size={19} />
          </div>

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              Health profile
            </h2>

            <p className="text-xs text-slate-400">
              Information that can help personalize the experience.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <MiniProfileCard
            title="Reports"
            value="—"
          />

          <MiniProfileCard
            title="Risk assessments"
            value="—"
          />

          <MiniProfileCard
            title="Health history"
            value="—"
          />

        </div>

      </section>


      {/* SECURITY */}

      <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 dark:border-teal-900/40 dark:bg-teal-950/20">

        <div className="flex items-start gap-3">

          <ShieldCheck
            size={19}
            className="mt-0.5 text-teal-600"
          />

          <div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Privacy and security
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Authentication, secure storage and access controls
              will be implemented with the backend.
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}


function ProfileField({
  icon,
  label,
  value,
}) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {value}
          </p>

        </div>

      </div>

    </div>
  )
}


function MiniProfileCard({
  title,
  value,
}) {

  return (
    <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/70">

      <p className="text-xs text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-300">
        {value}
      </p>

    </div>
  )
}


export default Profile