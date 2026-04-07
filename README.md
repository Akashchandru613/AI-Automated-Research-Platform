# ATLAS - AI-Powered Tool for Literature & Analytical Studies

A full-stack multi-agent AI research platform that enables researchers to upload datasets and documents, run AI-powered analysis pipelines, and explore results through interactive dashboards.

## Architecture

```
User Input (CSV / PDF / Text Query)
        |
        v
+------------------+
|   Orchestrator    |  Decides which agents to activate
+--------+---------+
    |    |    |         |
    v    v    v         v
+------+------+--------+----------+
| Data | Anal-| Summary| Literature|
| Clean| ysis |  Agent |  Agent   |
| Agent| Agent|        |          |
+--+---+--+---+---+----+----+-----+
   |      |       |         |
   +------+-------+---------+
                |
         +------v---------+
         | Report Generator|
         +--------+--------+
                  v
           +-----------+
           |   Chat    |  Post-analysis Q&A
           |   Agent   |
           +-----------+
```

## Features

### Multi-Agent AI System (LangGraph)
- **Orchestrator Agent** - Routes tasks to appropriate specialized agents
- **Data Cleaning Agent** - Detects missing values, outliers, type mismatches
- **Analysis Agent** - Computes 15+ statistical metrics (scipy/numpy)
- **Summary Agent** - Summarizes uploaded PDFs and documents
- **Literature Agent** - Searches Semantic Scholar for related papers
- **Report Generator** - Creates comprehensive markdown reports with citations
- **Chat Agent** - Conversational Q&A about analysis results

### Interactive Dashboard
- Descriptive statistics cards (mean, median, std dev, min, max, quartiles)
- Correlation heatmap with color coding
- Distribution histograms per column
- Trend analysis with regression overlay
- Hypothesis test results (Shapiro-Wilk, Welch's T-Test)
- Custom chart builder (scatter, line, bar, pie) with PNG export
- Publication mode toggle for journal-ready styling

### Literature & Knowledge
- Paper search via Semantic Scholar API
- Auto-generated citations with BibTeX export
- Knowledge graph visualization (react-force-graph)

### Workflow & Organization
- Research templates (EDA, A/B Test, Survey, Correlation Study)
- Side-by-side experiment comparison
- Project tags and search/filter
- Bookmarks with notes
- Activity log
- One-click ZIP export (data + metrics + reports)

### Authentication
- JWT-based signup/login with refresh tokens
- Protected routes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Recharts, React Router, Axios |
| Backend | Python, FastAPI, SQLAlchemy (async), Alembic |
| Database | PostgreSQL |
| AI/ML | Google Gemini API, LangGraph, scipy, numpy, pandas |
| Literature | Semantic Scholar API |

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 16+
- Google Gemini API key (free at https://aistudio.google.com/apikey)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/AI-Automated_Research_Platform.git
cd AI-Automated_Research_Platform
```

### 2. Database

```bash
createdb atlas_db
```

### 3. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file:

```env
DATABASE_URL=postgresql+asyncpg://youruser@localhost:5432/atlas_db
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

Start the server:

```bash
uvicorn app.main:app --reload
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open

Visit `http://localhost:5173` in your browser.

## API Endpoints

| Category | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| Projects | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}` |
| Files | `POST /api/projects/{id}/files`, `GET /api/files/{id}/preview` |
| Experiments | `POST /api/projects/{id}/experiments`, `GET /api/experiments/{id}/metrics` |
| Chat | `POST /api/experiments/{id}/chat`, `GET /api/experiments/{id}/chat/history` |
| Literature | `GET /api/literature/search`, `GET /api/experiments/{id}/knowledge-graph` |
| Reports | `GET /api/experiments/{id}/report`, `GET /api/experiments/{id}/citations` |
| Compare | `GET /api/experiments/compare?ids=X,Y` |
| Export | `GET /api/projects/{id}/export` |

## Database Schema

10 tables: `users`, `projects`, `file_uploads`, `experiments`, `metrics`, `reports`, `citations`, `bookmarks`, `activity_logs`, `chat_messages`

## Project Structure

```
AI-Automated_Research_Platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # Async SQLAlchemy
│   │   ├── models/              # 10 ORM models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── agents/              # LangGraph multi-agent system
│   │   │   ├── state.py         # AgentState TypedDict
│   │   │   ├── graph.py         # StateGraph definition
│   │   │   ├── orchestrator.py  # Task routing
│   │   │   ├── data_cleaning.py # Data quality checks
│   │   │   ├── analysis.py      # Statistical computation
│   │   │   ├── summary.py       # Document summarization
│   │   │   ├── literature.py    # Semantic Scholar search
│   │   │   ├── report_generator.py
│   │   │   └── chat_agent.py    # Conversational AI
│   │   └── utils/               # Security, parsers, statistics
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/                 # Axios API clients
│       ├── context/             # Auth context
│       ├── pages/               # 8 page components
│       └── components/          # 25+ UI components
├── demo/                        # Sample CSV + PDF for testing
└── README.md
```
