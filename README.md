# MedExplain_AI — Intelligent Medical Report Interpreter & Health Analytics Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Embedded%20%2F%20Local-green.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**MedExplain_AI** is a multimodal medical diagnostic interpreter, patient report analyzer, and longitudinal health tracking platform. It bridges the communication gap between complex clinical laboratory reports and patients by combining a **deterministic local clinical rule engine** with **multimodal AI (Google Gemini)** to extract biomarkers, translate medical jargon into plain language, calculate certified clinical risk scores, and simulate counterfactual "what-if" lifestyle changes.

---

## 🌟 Key Features

* **📄 Automated Multimodal Ingestion:** Upload PDF laboratory reports or camera-captured images (JPG/PNG/WebP).
* **⚡ Hybrid Parsing Pipeline:**
  * **Local Deterministic Rule Engine:** Instant (<1 sec), 100% offline, zero-cost regex and columnar table parser for blood, urine, lipid, and metabolic panels.
  * **Demographics Extraction:** Automatically captures Patient Name, Age, Gender, DOB, Physician, Lab Facility, and Specimen Date.
  * **Google Gemini AI Integration:** Advanced multimodal understanding for handwritten notes, complex formatting, and empathetic patient explanations.
* **🩺 Certified Clinical Risk Calculators:**
  * **KDIGO CKD-EPI (2021 Race-Free Formula):** Staging chronic kidney disease (CKD Stages 1–5) and eGFR calculation.
  * **ADA Standards of Care:** Glycemic status categorization (Normal, Prediabetes, Type 2 Diabetes) using Fasting Glucose & HbA1c.
  * **ACC/AHA ASCVD Risk Estimator:** 10-year percentage risk projection for stroke and cardiovascular disease.
* **📈 Longitudinal Health Tracking & Comparison:**
  * Trendline charts (Recharts) showing biomarker changes across historical tests.
  * Side-by-side comparison with numerical differentials and delta indicators (Improved, Worsened, Stable).
* **🔮 Counterfactual "What-If" Simulation:**
  * Interactive sliders allowing patients to test hypothetical lifestyle or medication changes (e.g., *"What if my systolic BP drops from 145 to 125 mmHg?"*).
* **🔒 Privacy-First Architecture:**
  * Private local storage (files stream only to authenticated owners).
  * JWT authentication with HttpOnly cookies and bcrypt password hashing (12 rounds).
  * 100% offline-capable embedded database.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5.7, Vite 6, Tailwind CSS 3.4, Recharts 2.15, Lucide React, React Hook Form, Zod, Sonner |
| **Backend** | Node.js, Express.js 4.21, TypeScript, TSX, Multer, PDF-Parse, CORS, Dotenv, Helmet, Express Rate Limit |
| **Database** | MongoDB, Mongoose 8.9, Embedded Mongo Memory Server (Persistent WiredTiger) |
| **AI / ML** | Google Gemini 1.5 Flash/Pro (`@google/generative-ai`), Local Clinical Rule Engine (`localExtractor.ts`) |
| **Tooling** | npm Workspaces, Concurrently, Vitest, Native C# Launcher (`MedExplain_AI.exe`) |

---

## 🚀 Quick Start Guide

### Prerequisites
* [Node.js (v20 or higher)](https://nodejs.org/)
* npm (v10 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/om22310858-cloud/MedExplain_AI.git
cd MedExplain_AI
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(The default `.env` is pre-configured with embedded MongoDB and local storage. To enable Google Gemini AI, add your free key from [Google AI Studio](https://aistudio.google.com/) to `GEMINI_API_KEY`).*

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Servers
```bash
npm run dev
```
* **Frontend:** http://localhost:5173  
* **Backend REST API:** http://localhost:5000/api/v1  
* **Health Check:** http://localhost:5000/api/v1/health  

---

## ⚡ 1-Click Native Launcher (Windows)

Double-click `MedExplain_AI.exe` in the root folder. It will:
1. Verify Node.js and npm prerequisites.
2. Install any missing dependencies.
3. Launch backend API and frontend Vite servers.
4. Automatically open your browser at `http://localhost:5173`.

---

## 🗄️ Pre-Loaded Clinical Database (Restore in 1 Second)

The project includes `database_backup.json` containing 27 clinical lab reports, 199 biomarkers, 52 risk assessments, and demo accounts. To populate or reset the database:

```bash
node restore_backup.js
```

### Demo Login Credentials:
* **Doctor Account:** `doctor@hospital.org` / `Demo123!`
* *(Or register a new account instantly via the registration page).*

---

## 🧪 Included Sample Test Reports

A curated suite of sample laboratory reports is provided in the `test_reports/` directory for testing:
* `01_stroke_HIGH_risk.pdf` & `03_stroke_LOW_risk.pdf`
* `04_heart_HIGH_risk.pdf` & `05_heart_LOW_risk.pdf`
* `06_diabetes_longitudinal_Jan.pdf`, `Apr.pdf`, `Aug.pdf`
* `09_kidney_CKD_pattern.pdf`
* `10_pcos_pattern.pdf`
* `12_stroke_HIGH_risk_SCANNED_image.jpg` (OCR evaluation)
* `EXPECTED_VALUES_answer_key.json`

---

## 🎓 Academic Defense & Presentation Documents

* 📊 **PowerPoint Presentation Deck:** `MedExplain_AI_Final_Presentation.pptx` (15 widescreen slides covering problem statement, system architecture, clinical validation, and future roadmap).
* 📖 **Viva & Defense Guide:** `COLLEGE_DEFENSE_AND_VIVA_GUIDE.md` (comprehensive examiner Q&A answers, algorithm derivations, and live demo script).

---

## 🛡️ Medical Disclaimer

MedExplain_AI is designed for educational, informational, and clinical decision-support purposes. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for clinical decisions.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
