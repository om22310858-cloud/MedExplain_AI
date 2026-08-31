import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'


/* ============================================================
   LAZY LOAD PAGES
   ============================================================ */

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ReportUpload = lazy(() => import('./pages/ReportUpload'))
const ReportAnalysis = lazy(() => import('./pages/ReportAnalysis'))
const RiskAssessment = lazy(() => import('./pages/RiskAssessment'))

const HealthHistory = lazy(() => import('./pages/HealthHistory'))
const WhatIfAnalysis = lazy(() => import('./pages/WhatIfAnalysis'))
const Guidance = lazy(() => import('./pages/Guidance'))
const HealthRecords = lazy(() => import('./pages/HealthRecords'))

const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))


/* ============================================================
   LOADING SCREEN
   ============================================================ */

function PageLoader() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">

      <div className="text-center">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading MedExplain AI...
        </p>

      </div>

    </div>
  )
}


/* ============================================================
   APP
   ============================================================ */

function App() {

  return (

    <BrowserRouter>

      <AppLayout>

        <Suspense fallback={<PageLoader />}>

          <Routes>

            {/* ================= DASHBOARD ================= */}

            <Route
              path="/"
              element={<Dashboard />}
            />


            {/* ================= REPORTS ================= */}

            <Route
              path="/reports"
              element={<ReportUpload />}
            />

            <Route
              path="/reports/analysis"
              element={<ReportAnalysis />}
            />


            {/* ================= RISK ================= */}

            <Route
              path="/risk-assessment"
              element={<RiskAssessment />}
            />


            {/* ================= HEALTH ================= */}

            <Route
              path="/health-history"
              element={<HealthHistory />}
            />

            <Route
              path="/health-records"
              element={<HealthRecords />}
            />


            {/* ================= AI FEATURES ================= */}

            <Route
              path="/what-if"
              element={<WhatIfAnalysis />}
            />

            <Route
              path="/guidance"
              element={<Guidance />}
            />


            {/* ================= ACCOUNT ================= */}

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

          </Routes>

        </Suspense>

      </AppLayout>

    </BrowserRouter>

  )
}


export default App