import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'


function WhatIfAnalysis() {

  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-6xl space-y-7">

      {/* HEADER */}

      <header>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
          <SlidersHorizontal size={16} />
          WHAT-IF ANALYSIS
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Explore health scenarios
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Explore how changing selected health values could affect
          a model's estimated risk. This feature will become
          available after the prediction models are connected.
        </p>

      </header>


      {/* INTRO */}

      <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-teal-600 p-7 text-white">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div className="max-w-2xl">

            <div className="flex items-center gap-2 text-violet-100">

              <Sparkles size={17} />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                Explainable health AI
              </span>

            </div>

            <h2 className="mt-3 text-2xl font-bold">
              Ask “what could change?”
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/80">
              Change compatible health inputs and compare the
              model's estimated output. This is an educational
              simulation, not a treatment recommendation.
            </p>

          </div>


          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <BrainCircuit size={30} />
          </div>

        </div>

      </section>


      {/* MODEL SELECT */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30">
            <Activity size={19} />
          </div>

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              Select assessment
            </h2>

            <p className="text-xs text-slate-400">
              Choose which model you want to explore.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <ScenarioModel
            title="Diabetes Risk"
            description="Explore diabetes model inputs."
            active
          />

          <ScenarioModel
            title="Heart Disease Risk"
            description="Explore cardiovascular model inputs."
          />

        </div>

      </section>


      {/* INPUTS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="font-bold text-slate-900 dark:text-white">
              Scenario inputs
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Real report-derived values will appear here.
            </p>

          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-400 dark:bg-slate-800">
            MODEL NOT CONNECTED
          </span>

        </div>


        <div className="mt-6 grid gap-5 md:grid-cols-2">

          <InputPlaceholder
            label="Glucose"
            unit="mg/dL"
          />

          <InputPlaceholder
            label="BMI"
            unit=""
          />

          <InputPlaceholder
            label="Blood Pressure"
            unit="mmHg"
          />

          <InputPlaceholder
            label="Age"
            unit="years"
          />

        </div>


        <button
          type="button"
          disabled
          className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-400 dark:bg-slate-800"
        >
          <Sparkles size={17} />
          Run What-If Simulation
        </button>

      </section>


      {/* RESULT */}

      <section className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-7 text-center dark:border-violet-900/40 dark:bg-violet-950/20">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-violet-500 shadow-sm dark:bg-slate-900">

          <BrainCircuit size={22} />

        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          Simulation results will appear here
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-400">
          Once the ML model is integrated, this section will
          compare the original prediction with the scenario
          prediction and explain the difference.
        </p>

      </section>


      {/* DISCLAIMER */}

      <div className="flex items-center justify-center gap-2 pb-4 text-center text-[10px] text-slate-400">

        <Info size={13} />

        What-if results are simulations for educational purposes,
        not medical recommendations.

      </div>

    </div>
  )
}


/* ============================================================
   MODEL CARD
============================================================ */

function ScenarioModel({
  title,
  description,
  active,
}) {

  return (
    <div
      className={`
        rounded-xl
        border
        p-5

        ${
          active
            ? 'border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20'
            : 'border-slate-200 dark:border-slate-800'
        }
      `}
    >

      <div className="flex items-center justify-between">

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

        {active && (
          <CheckCircle2
            size={18}
            className="text-teal-500"
          />
        )}

      </div>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>

    </div>
  )
}


/* ============================================================
   INPUT
============================================================ */

function InputPlaceholder({
  label,
  unit,
}) {

  return (
    <div>

      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </label>

      <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">

        <span className="flex-1 text-sm text-slate-300">
          Awaiting report value
        </span>

        <span className="text-[10px] text-slate-400">
          {unit}
        </span>

      </div>

    </div>
  )
}


export default WhatIfAnalysis