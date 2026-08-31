import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  Info,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'

function RiskAssessment() {
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
          Back
        </button>


        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <div className="flex items-center gap-2">

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <Activity size={16} />
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600">
                AI Risk Assessment
              </span>

            </div>


            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Understand your health risks
            </h1>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              AI-assisted risk estimates based on compatible
              information extracted from your medical report.
            </p>

          </div>


          {/* Report status */}

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 md:self-auto">

            <CheckCircle2 size={15} />

            Report connected

          </div>

        </div>

      </header>


      {/* =====================================================
          CONNECTED REPORT
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Stethoscope size={21} />
            </div>


            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Analysis source
              </p>

              <h2 className="mt-1 text-sm font-bold text-slate-800">
                Uploaded medical report
              </h2>

            </div>

          </div>


          <div className="flex items-center gap-2 text-xs text-slate-400">

            <ShieldCheck size={15} />

            Using compatible report values

          </div>

        </div>

      </section>


      {/* =====================================================
          RISK MODELS
      ===================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-lg font-bold text-slate-900">
            Risk Assessment
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Select a health risk model to review its assessment
            and explanation.
          </p>

        </div>


        <div className="grid gap-5 lg:grid-cols-2">

          {/* =================================================
              DIABETES
          ================================================= */}

          <RiskCard
            icon={
              <Activity
                size={23}
              />
            }
            iconClass="bg-teal-50 text-teal-600"
            title="Diabetes Risk"
            subtitle="Diabetes risk prediction and AI explanation"
            description="The diabetes model will use compatible health information extracted from the uploaded report."
            status="Not analyzed"
            statusClass="bg-slate-100 text-slate-500"
            accent="teal"
          />


          {/* =================================================
              HEART
          ================================================= */}

          <RiskCard
            icon={
              <HeartPulse
                size={23}
              />
            }
            iconClass="bg-rose-50 text-rose-500"
            title="Heart Disease Risk"
            subtitle="Cardiovascular risk prediction and explanation"
            description="The heart disease model will use compatible information available from the medical report."
            status="Not analyzed"
            statusClass="bg-slate-100 text-slate-500"
            accent="rose"
          />

        </div>

      </section>


      {/* =====================================================
          MODEL INPUTS
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            <Activity size={18} />
          </div>


          <div>

            <h2 className="font-bold text-slate-900">
              Report information used by the models
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Only compatible values will be provided to each
              prediction model.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <ModelInput
            label="Glucose"
            value="Awaiting extraction"
          />

          <ModelInput
            label="Blood Pressure"
            value="Awaiting extraction"
          />

          <ModelInput
            label="BMI"
            value="Awaiting extraction"
          />

          <ModelInput
            label="Age"
            value="Awaiting extraction"
          />

        </div>


        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">

          <Info
            size={16}
            className="mt-0.5 shrink-0 text-blue-500"
          />

          <p className="text-[11px] leading-5 text-blue-700/70">
            The values above are placeholders until the report
            extraction pipeline is connected. No prediction is
            generated from placeholder information.
          </p>

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
              Explainable AI
            </p>


            <h2 className="mt-1 text-xl font-bold text-slate-900">
              See why the model made its prediction
            </h2>


            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              MedExplain AI will show the important factors
              influencing a risk prediction instead of presenting
              only a probability or risk label.
            </p>


            <div className="mt-6 grid gap-3 md:grid-cols-3">

              <XaiFeature
                number="01"
                title="Important factors"
                description="Identify which health features influenced the model."
              />

              <XaiFeature
                number="02"
                title="Feature impact"
                description="Understand whether a feature increases or decreases predicted risk."
              />

              <XaiFeature
                number="03"
                title="Simple explanation"
                description="Translate model behavior into understandable language."
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-lg font-bold text-slate-900">
            How the assessment works
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            From medical report to explainable AI.
          </p>

        </div>


        <div className="grid gap-4 md:grid-cols-4">

          <StepCard
            number="01"
            title="Extract"
            description="Health information is extracted from the uploaded report."
          />

          <StepCard
            number="02"
            title="Prepare"
            description="Compatible features are prepared for the selected model."
          />

          <StepCard
            number="03"
            title="Predict"
            description="The trained ML model generates an AI-assisted risk estimate."
          />

          <StepCard
            number="04"
            title="Explain"
            description="XAI identifies important factors behind the prediction."
          />

        </div>

      </section>


      {/* =====================================================
          DISCLAIMER
      ===================================================== */}

      <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">

        <div className="flex items-start gap-3">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-amber-500"
          />

          <div>

            <h3 className="text-xs font-bold text-amber-800">
              Important
            </h3>

            <p className="mt-1 text-[11px] leading-5 text-amber-700/70">
              Risk predictions are AI-assisted estimates intended
              for educational and informational purposes. They are
              not medical diagnoses and should not replace advice
              from a qualified healthcare professional.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="flex items-center justify-center gap-2 pb-4 text-[10px] text-slate-400">

        <ShieldCheck size={13} />

        MedExplain AI • Explain health information clearly

      </div>

    </div>
  )
}


/* =============================================================
   RISK CARD
============================================================= */

function RiskCard({
  icon,
  iconClass,
  title,
  subtitle,
  description,
  status,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-lg hover:shadow-slate-200/40">

      <div className="flex items-start justify-between">

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
          {icon}
        </div>


        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 text-slate-300 transition group-hover:border-teal-100 group-hover:text-teal-500">
          <ChevronRight size={18} />
        </div>

      </div>


      <div className="mt-5">

        <h3 className="text-lg font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-xs font-medium text-slate-400">
          {subtitle}
        </p>

        <p className="mt-4 text-xs leading-6 text-slate-500">
          {description}
        </p>

      </div>


      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {status}
        </span>


        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
        >
          View assessment
          <ArrowRight size={14} />
        </button>

      </div>

    </div>
  )
}


/* =============================================================
   MODEL INPUT
============================================================= */

function ModelInput({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xs font-semibold text-slate-500">
        {value}
      </p>

    </div>
  )
}


/* =============================================================
   XAI FEATURE
============================================================= */

function XaiFeature({
  number,
  title,
  description,
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white/70 p-4">

      <span className="text-[10px] font-bold tracking-[0.15em] text-violet-500">
        {number}
      </span>

      <h3 className="mt-3 text-xs font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        {description}
      </p>

    </div>
  )
}


/* =============================================================
   STEP CARD
============================================================= */

function StepCard({
  number,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">

      <span className="text-[10px] font-bold tracking-[0.16em] text-teal-500">
        {number}
      </span>

      <h3 className="mt-3 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        {description}
      </p>

    </div>
  )
}


export default RiskAssessment