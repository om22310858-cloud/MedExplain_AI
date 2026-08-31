import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'

function ReportUpload() {
  const navigate = useNavigate()

  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  /* =========================================================
     FILE VALIDATION
  ========================================================= */

  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ]

  const handleFile = (file) => {
    if (!file) return

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file.')
      return
    }

    setSelectedFile(file)
  }


  /* =========================================================
     FILE INPUT
  ========================================================= */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    handleFile(file)
  }


  /* =========================================================
     DRAG & DROP
  ========================================================= */

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()

    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]

    handleFile(file)
  }


  /* =========================================================
     REMOVE FILE
  ========================================================= */

  const removeFile = (event) => {
    event?.stopPropagation()

    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  /* =========================================================
     OPEN FILE PICKER
  ========================================================= */

  const openFilePicker = (event) => {
    event?.stopPropagation()

    fileInputRef.current?.click()
  }


  /* =========================================================
     FILE SIZE
  ========================================================= */

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'

    const megabytes = bytes / (1024 * 1024)

    if (megabytes >= 1) {
      return `${megabytes.toFixed(1)} MB`
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }


  /* =========================================================
     ANALYZE REPORT
  ========================================================= */

  const analyzeReport = () => {
    if (!selectedFile) return

    /*
      For now we pass basic file information to the analysis page.

      Later this same flow will send the actual file to:
      
      React
        ↓
      FastAPI
        ↓
      OCR / Report Parser
        ↓
      Structured Medical Data
        ↓
      ML Models
        ↓
      XAI
    */

    navigate('/reports/analysis', {
      state: {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      },
    })
  }


  return (
    <div className="mx-auto max-w-5xl space-y-7">

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


        <div className="flex items-start gap-4">

          {/* Icon */}

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <FileText size={23} />
          </div>


          {/* Heading */}

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600">
              Medical Report Intelligence
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Analyze a medical report
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Upload your medical report and MedExplain AI will
              prepare the information for explanation and health
              analysis.
            </p>

          </div>

        </div>

      </header>


      {/* =====================================================
          UPLOAD CARD
      ===================================================== */}

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-7">

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => openFilePicker()}
          className={`relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-all duration-200 ${
            isDragging
              ? 'border-teal-500 bg-teal-50'
              : selectedFile
                ? 'border-teal-200 bg-teal-50/30'
                : 'border-slate-200 bg-slate-50/60 hover:border-teal-300 hover:bg-teal-50/30'
          }`}
        >

          {/* Hidden file input */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />


          {/* =================================================
              NO FILE SELECTED
          ================================================= */}

          {!selectedFile && (
            <>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
                <UploadCloud
                  size={29}
                  strokeWidth={1.8}
                />
              </div>


              <h2 className="mt-6 text-lg font-bold text-slate-800">
                {isDragging
                  ? 'Drop your report here'
                  : 'Drag & drop your medical report'}
              </h2>


              <p className="mt-2 text-sm text-slate-400">
                or choose a file from your computer
              </p>


              <button
                type="button"
                onClick={openFilePicker}
                className="mt-6 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700"
              >
                Browse files
              </button>


              <p className="mt-5 text-[11px] text-slate-400">
                Supported formats: PDF, JPG, PNG
              </p>


              <p className="mt-1 text-[10px] text-slate-300">
                Maximum file size will be configured with the backend.
              </p>

            </>
          )}


          {/* =================================================
              FILE SELECTED
          ================================================= */}

          {selectedFile && (
            <>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
                <CheckCircle2
                  size={30}
                />
              </div>


              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-600">
                Report selected
              </p>


              <h2
                className="mt-2 max-w-md truncate text-lg font-bold text-slate-800"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </h2>


              <p className="mt-2 text-sm text-slate-400">
                {formatFileSize(selectedFile.size)}
              </p>


              <button
                type="button"
                onClick={removeFile}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-500"
              >
                <X size={14} />
                Remove file
              </button>

            </>
          )}

        </div>


        {/* =====================================================
            BOTTOM ACTION AREA
        ===================================================== */}

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">


          {/* Privacy information */}

          <div className="flex items-start gap-3">

            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <ShieldCheck size={16} />
            </div>


            <div>

              <p className="text-xs font-semibold text-slate-700">
                Your report stays private
              </p>

              <p className="mt-0.5 text-[10px] leading-5 text-slate-400">
                Secure handling will be implemented with the backend.
              </p>

            </div>

          </div>


          {/* Analyze button */}

          <button
            type="button"
            disabled={!selectedFile}
            onClick={analyzeReport}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ${
              selectedFile
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            }`}
          >

            <Sparkles size={17} />

            Analyze Report

          </button>

        </div>

      </section>


      {/* =====================================================
          WHAT HAPPENS NEXT
      ===================================================== */}

      <section>

        <div className="mb-4">

          <h2 className="text-lg font-bold text-slate-900">
            What happens next?
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Your report will move through these stages.
          </p>

        </div>


        <div className="grid gap-4 md:grid-cols-4">

          <ProcessCard
            number="01"
            title="Extract"
            description="Relevant information is identified from the report."
          />

          <ProcessCard
            number="02"
            title="Understand"
            description="Medical findings are organized into understandable sections."
          />

          <ProcessCard
            number="03"
            title="Assess"
            description="Relevant health risk models can use compatible report values."
          />

          <ProcessCard
            number="04"
            title="Explain"
            description="AI explanations help you understand important results."
          />

        </div>

      </section>


      {/* =====================================================
          INFORMATION / DISCLAIMER
      ===================================================== */}

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

        <Info
          size={17}
          className="mt-0.5 shrink-0 text-blue-500"
        />

        <p className="text-[11px] leading-5 text-blue-700/70">
          MedExplain AI is designed to help organize and explain
          health information. Risk predictions are AI-assisted
          estimates and should not be treated as a medical diagnosis.
        </p>

      </div>

    </div>
  )
}


/* =============================================================
   PROCESS CARD
============================================================= */

function ProcessCard({
  number,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md hover:shadow-slate-200/40">

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


export default ReportUpload