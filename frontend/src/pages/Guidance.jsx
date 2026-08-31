import {
  BookOpen,
  CheckCircle2,
  HeartPulse,
  Info,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'


function Guidance() {

  return (
    <div className="mx-auto max-w-6xl space-y-7">

      <header>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-500">
          <Lightbulb size={16} />
          GUIDANCE
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Understand your health information
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Educational guidance to help you understand medical
          reports, health measurements, risk predictions and
          explanations.
        </p>

      </header>


      {/* FEATURED */}

      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-7 dark:border-amber-900/40 dark:bg-amber-950/20">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm dark:bg-slate-900">
            <Sparkles size={22} />
          </div>

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">
              MedExplain AI
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              From numbers to understanding
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Medical reports can contain unfamiliar measurements
              and terminology. MedExplain AI is designed to
              organize and explain this information in simpler
              language.
            </p>

          </div>

        </div>

      </section>


      {/* GUIDANCE CARDS */}

      <section className="grid gap-5 md:grid-cols-2">

        <GuideCard
          icon={<BookOpen size={21} />}
          title="Understanding medical reports"
          description="Learn how common report values and sections are organized."
        />

        <GuideCard
          icon={<HeartPulse size={21} />}
          title="Understanding health risks"
          description="Learn the difference between a risk estimate and a diagnosis."
        />

        <GuideCard
          icon={<ShieldCheck size={21} />}
          title="Using AI responsibly"
          description="Understand why AI explanations should be interpreted carefully."
        />

        <GuideCard
          icon={<CheckCircle2 size={21} />}
          title="Preparing for a consultation"
          description="Use your report insights to prepare questions for a healthcare professional."
        />

      </section>


      {/* HOW TO READ */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30">
            <BookOpen size={19} />
          </div>

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              A simple way to read your results
            </h2>

            <p className="text-xs text-slate-400">
              Use these three questions when reviewing health information.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-5 md:grid-cols-3">

          <GuideStep
            number="01"
            title="What does it mean?"
          >
            Understand what the measurement represents.
          </GuideStep>

          <GuideStep
            number="02"
            title="Why does it matter?"
          >
            Understand why a value may be relevant.
          </GuideStep>

          <GuideStep
            number="03"
            title="What should I ask?"
          >
            Prepare questions to discuss with a professional.
          </GuideStep>

        </div>

      </section>


      {/* DISCLAIMER */}

      <div className="flex items-start justify-center gap-2 pb-4 text-center text-[10px] leading-5 text-slate-400">

        <Info size={13} className="mt-0.5" />

        MedExplain AI provides educational information and does
        not replace professional medical advice.

      </div>

    </div>
  )
}


function GuideCard({
  icon,
  title,
  description,
}) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>

    </div>
  )
}


function GuideStep({
  number,
  title,
  children,
}) {

  return (
    <div>

      <span className="text-[10px] font-bold tracking-[0.16em] text-teal-600">
        {number}
      </span>

      <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {children}
      </p>

    </div>
  )
}


export default Guidance