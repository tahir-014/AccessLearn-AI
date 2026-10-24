# AccessLearn AI 🌟
> **An Inclusive, AI-Powered Learning Platform with Bilingual (English & Telugu) Support, Native Text-to-Speech, and Accessible Study Tools.**

AccessLearn AI breaks down educational barriers by converting standard PDF textbooks, lecture notes, and study documents into accessible, multi-modal learning experiences. It features automatic simplification, bilingual translations, interactive browser Text-to-Speech, context-aware AI tutoring, dynamic quizzes with instant feedback, and accessible themes.

---

## 🚀 Key Features

1. **Accessible PDF Extraction**: Safely uploads PDF learning documents (up to 10MB) and extracts clean text page-by-page.
2. **Bilingual Simplification (English & Telugu)**: Distills complex academic prose into clear summaries, key concepts, vocabulary, and real-world examples in English and Telugu (`తెలుగు`).
3. **Interactive Text-to-Speech (TTS)**: Built-in browser speech synthesis with play, pause, resume, stop, speed rate controls (0.75x to 1.5x), and native voice selection.
4. **Context-Aware AI Tutor**: Conversational study assistant that answers questions grounded in uploaded documents and stores chat history.
5. **Dynamic Practice Quizzes**: Automatically generates multiple-choice quizzes from study materials, calculates scores, provides explanations, and tracks history.
6. **SQLite Learning History**: Stores uploaded materials, simplifications, tutor dialogues, and quiz attempts locally with zero external database configuration.
7. **Accessibility First (WCAG Compliant)**:
   - High Contrast theme (Yellow-on-Black / high border visibility)
   - Font size scaling (Small, Medium, Large, X-Large) with live preview
   - Keyboard navigable with prominent focus rings and skip-to-content links
   - Screen-reader friendly ARIA landmarks and live regions
8. **Seamless Demo / Mock Mode**: Runs completely out of the box even without a Gemini API key.

---

## 📂 Project Architecture

```text
AccessLearn-AI/
├── frontend/
│   ├── public/
│   │   └── logo.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── FeatureCard.jsx
│   │   │   ├── FileUploader.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Learn.jsx
│   │   │   ├── Quiz.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Tutor.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── database/
│   │   │   └── db.py
│   │   ├── routes/
│   │   │   ├── lessons.py
│   │   │   ├── quizzes.py
│   │   │   └── tutor.py
│   │   ├── services/
│   │   │   ├── ai_service.py
│   │   │   └── pdf_service.py
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_ai_service.py
│   │   ├── test_api_endpoints.py
│   │   └── test_pdf_service.py
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla Accessible CSS (WCAG AAA contrast support)
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2, PyPDF
- **AI Engine**: Google Gemini API (REST endpoint `gemini-1.5-flash`), with built-in Mock / Demo mode fallback
- **Database**: SQLite (built-in Python sqlite3 with connection pooling & relational schema)

---

## 💻 Windows PowerShell Setup & Execution Guide

Follow these exact commands in **Windows PowerShell** to install and run both servers.

### 1. Prerequisites Check
Ensure Python and Node.js are available on your PATH:
```powershell
python --version
node --version
npm --version
```

---

### 2. Backend Setup & Run

Open a Windows PowerShell terminal in the repository root (`AccessLearn-AI`):

```powershell
# Navigate to backend directory
cd "d:\Project 2026\AccessLearn-AI\backend"

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install required dependencies
pip install -r requirements.txt

# (Optional) Configure Gemini API Key:
# Copy .env.example to .env and set GEMINI_API_KEY if you have one.
# If omitted, AccessLearn AI automatically runs in Demo AI Mode.
Copy-Item .env.example .env

# Run backend tests to verify installation
pytest -v

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000`.
You can view interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup & Run

Open a **second** Windows PowerShell terminal:

```powershell
# Navigate to frontend directory
cd "d:\Project 2026\AccessLearn-AI\frontend"

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:5173
```

---

## 🧪 Running Backend Automated Tests

To execute the test suite (testing PDF extraction, bilingual AI simplification, tutor endpoints, quiz grading, and database persistence):

```powershell
cd "d:\Project 2026\AccessLearn-AI\backend"
.\venv\Scripts\Activate.ps1
pytest -v
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key from [Google AI Studio](https://aistudio.google.com/) | Empty (Activates Demo Mode) |
| `GEMINI_MODEL` | Gemini model name | `gemini-1.5-flash` |
| `APP_HOST` | Host address | `127.0.0.1` |
| `APP_PORT` | Port number | `8000` |
| `MAX_UPLOAD_SIZE_MB` | Maximum allowed PDF size | `10` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://127.0.0.1:8000` (or proxy via `/api`) |

---

## ♿ Accessibility Features

- **High Contrast Theme**: Meets WCAG AAA requirements with prominent borders and high-visibility text.
- **Dynamic Text Resizing**: 4 discrete text scales without breaking layout.
- **Screen Reader Support**: Fully structured semantic landmarks (`role="banner"`, `role="navigation"`, `role="log"`, `role="status"`), `aria-live` polite regions, and `sr-only` skip navigation links.
- **Keyboard Navigation**: All interactive elements are reachable via Tab/Shift+Tab with visible focus rings.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
