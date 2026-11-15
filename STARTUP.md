# MedExplain_AI — Quickstart & Execution Guide

MedExplain_AI is an intelligent multimodal medical diagnostic interpreter, patient report analyzer, and longitudinal health tracking platform.

---

## 🚀 Option 1: Running in Visual Studio Code (Recommended)

1. **Open in VS Code**:
   - Open VS Code.
   - Go to `File` > `Open Folder...`
   - Select the unzipped project folder `MedExplain_AI_Complete_Project`.

2. **Open the Integrated Terminal**:
   - Press `` Ctrl + ` `` (Backtick) or click `Terminal` > `New Terminal` in the top menu.

3. **Install Dependencies** (if running for the first time):
   ```bash
   npm install
   ```

4. **Start Both Frontend and Backend Concurrently**:
   ```bash
   npm run dev
   ```
   *This starts both the Express API (Port 5000) and the Vite React UI (Port 5173) in one single terminal.*

5. **Open the Web Application**:
   - Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚡ Option 2: 1-Click Windows Executable Launcher

Inside the project root directory, double-click:
```
MedExplain_AI.exe
```
This native C# launcher automatically:
- Checks and verifies Node.js and npm
- Installs any missing dependencies
- Launches backend (port 5000) and frontend (port 5173) in clean windows
- Automatically opens your default web browser to `http://localhost:5173`

---

## 🗄️ Database Restoration (Pre-loaded 33 Clinical Reports)

The project includes an embedded offline MongoDB server and a complete backup file (`database_backup.json`) containing **33 medical reports, 199 biomarkers, 52 risk assessments, and 6 demo clinical profiles**.

To restore or reset the database at any time, run in the VS Code terminal:
```bash
node restore_backup.js
```

### Demo Login Credentials:
- **Email:** `doctor@hospital.org`
- **Password:** `Doctor123!`
*(Or register any new patient or clinician account instantly via the registration page).*

---

## 🧪 Included Sample Test Reports

A curated suite of clinical test reports is included in the `test_reports/` directory:
- `01_stroke_HIGH_risk.pdf` & `03_stroke_LOW_risk.pdf`
- `04_heart_HIGH_risk.pdf` & `05_heart_LOW_risk.pdf`
- `06_diabetes_longitudinal_Jan.pdf`, `Apr.pdf`, `Aug.pdf`
- `09_kidney_CKD_pattern.pdf`
- `10_pcos_pattern.pdf`
- `12_stroke_HIGH_risk_SCANNED_image.jpg` (OCR test)
- `13_heart_HIGH_risk_SCANNED_image.pdf`

---

## ⚙️ Optional: Configuring Google Gemini AI

MedExplain_AI has a built-in offline hybrid parser that automatically extracts tables, flags, and values locally without any API keys.

To enable full multimodal AI explanations:
1. Get a free API key at [https://aistudio.google.com/](https://aistudio.google.com/)
2. Open `.env` in VS Code and set:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Restart `npm run dev`.

---

## 🎓 Academic Defense & Presentation Materials
- **PowerPoint Presentation Deck:** `MedExplain_AI_Final_Presentation.pptx` (15 widescreen slides)
- **Viva & Defense Guide:** `COLLEGE_DEFENSE_AND_VIVA_GUIDE.md` (complete examiner Q&A answers, architecture, and live demo script)
