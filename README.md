# 🏭 European Industrial News Scanning Agent

> AI-powered RSS news aggregation and analysis system for tracking European industrial relocations, expansions, and business opportunities.

**🏆 BSMT Hackathon 2026 Project**  
**🤝 In Collaboration with Pro Sicht**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?logo=meta&logoColor=white)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Overview

An intelligent news scanning system developed for **BSMT Hackathon 2026** in collaboration with **Pro Sicht**, automatically monitoring European industrial news and providing actionable business development insights through AI-powered analysis.

### Key Capabilities

- 📡 **Automated RSS Monitoring** - Fetches news from 12+ European business sources
- 🤖 **AI Analysis** - Powered by Groq (Llama 3.3 70B Versatile) for intelligent content extraction
- 📊 **BIOS-Fit Scoring** - Proprietary algorithm scoring articles 0-100 for business opportunity relevance
- 🎨 **Smart Categorization** - Color-coded priority system (Green/Blue/Yellow/Gray)
- 🌐 **Modern Interface** - Responsive web UI with dark/light themes
- 📝 **Note Taking** - Add personal notes to articles for team collaboration
- ⏱️ **Timeline Detection** - Automatic temporal analysis (0-6m, 6-18m, 18-36m timeframes)

**Ideal for:** Investment firms, business development teams, market researchers, and analysts tracking European industrial movements and opportunities from a **Pro Sicht / BIOS perspective**.

---

## ✨ Features

### 🔧 Backend (FastAPI + SQLite)
- **RSS Management** - Add, delete, and refresh RSS sources dynamically
- **AI Analysis** - Groq LLM (Llama 3.3 70B) integration for intelligent content processing
- **BIOS-Fit Scoring** - Multi-factor relevance scoring algorithm with timeline analysis
- **Duplicate Prevention** - Content hashing to avoid redundant articles
- **Advanced Filtering** - Search by event type, score range, company, location
- **RESTful API** - Complete REST API with interactive Swagger documentation
- **Auto-Seeding** - Automatic RSS source initialization on startup
- **Note System** - User-specific article annotations

### 🎨 Frontend (Next.js + TypeScript)
- **Modern UI/UX** - Responsive design with dark/light theme support
- **Real-time Display** - Color-coded article cards based on priority
- **Smart Filtering** - Multi-criteria search and filter system
- **Auto-refresh** - Configurable automatic news updates with countdown
- **Timeline View** - Company-based timeline visualization
- **Article Details** - Comprehensive article view with score breakdown
- **Note Taking** - Add, edit, and delete personal notes on articles

### 🤖 AI & Intelligence
- **Event Classification** - Automatic categorization (relocation, expansion, closure, tender, new_plant, other)
- **Entity Extraction** - Company names, locations, and sector identification
- **Turkish Summaries** - AI-generated Turkish language summaries (2-4 sentences)
- **Timeline Detection** - Temporal analysis (0-6m, 6-18m, 18-36m timeframes)
- **Multi-factor Scoring** - Weighted scoring across 5 dimensions (E, A, G, T, C)
- **Confidence System** - Penalty mechanism for incomplete information
- **Fallback Logic** - Keyword-based analysis when AI is unavailable
- **Quota Management** - Graceful handling of API rate limits

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend runtime (npm or pnpm)
- **Groq API Key** - Get free API key from [Groq Console](https://console.groq.com/)

### Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/UKBey/EU_News_Analyze_Agent.git
cd EU_News_Analyze_Agent
```

#### 2️⃣ Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start backend server
uvicorn main:app --reload
```

✅ Backend running at: **http://localhost:8000**  
📚 API Documentation: **http://localhost:8000/docs**

#### 3️⃣ Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install
# or: pnpm install

# Start development server
npm run dev
# or: pnpm dev
```

✅ Frontend running at: **http://localhost:3000**

#### 4️⃣ Start Using

1. Open **http://localhost:3000** in your browser
2. RSS sources are automatically loaded on first startup
3. Click **"🔄 Yenile"** button to fetch and analyze articles
4. Use filters and search to find relevant news
5. Click on articles to view details and add notes

---

## 📊 BIOS-Fit Scoring System

The proprietary **BIOS-Fit algorithm** evaluates each article from a **Pro Sicht / BIOS perspective** to determine its value as a "business development opportunity" on a 0-100 scale. This weighted metric helps prioritize which industrial news deserves immediate attention.

### Formula

```
Score = 100 × (0.30×E + 0.25×A + 0.20×G + 0.15×T + 0.10×C)
```

**Rationale:** Event type (E) is most decisive because a tender announcement and a factory relocation have different values for BIOS. Actor clarity (A) is second priority because without knowing which company is moving where, the opportunity cannot be acted upon. Geography (G) is critical as Pro Sicht's operational area is Europe. Timeline (T) and source trust (C) are fine-tuning components for ranking.

### Scoring Components

| Component | Weight | Description | Scoring Rules |
|-----------|--------|-------------|---------------|
| **E** - Event Type | 30% | Type of industrial event | Relocation: 1.0, New Plant: 0.9, Expansion: 0.75, Tender: 0.55, Closure: 0.45, Other: 0.1 |
| **A** - Actor Clarity | 25% | Completeness of information | Company (+0.40), From Location (+0.25), To Location (+0.25), Sector (+0.10) |
| **G** - Geography | 20% | Geographic relevance | Europe (EU + UK + Turkey + Balkans): 1.0, Europe Neighborhood (Russia, North Africa): 0.5, Other: 0.1, Unknown: 0.3 |
| **T** - Time Window | 15% | Temporal specificity | 0-6 months: 1.0, 6-18 months: 0.7, 18-36 months: 0.4, Unspecified: 0.3 |
| **C** - Source Trust | 10% | Source credibility | Company Official/IR: 1.0, Premium News (Reuters, Bloomberg, FT): 0.85, Industry Publication: 0.7, General News: 0.55, Blog/Forum: 0.25 |

### Timeline Detection

The system automatically detects when events will occur based on article content:

| Timeline | Score | Indicators |
|----------|-------|------------|
| **0-6m** | 1.0 | "announced", "will move", "will open", "this year", "Q1/Q2/Q3/Q4", "soon", "upcoming", "imminently" |
| **6-18m** | 0.7 | "next year", "by [next year]", "planned for [year]" |
| **18-36m** | 0.4 | "by 2028", "by 2029", "long-term plan", "in the coming years" |
| **null** | 0.3 | No time indicators found in text |

### Confidence Penalty

Articles with incomplete information receive a penalty:

```python
confidence = filled_fields / 5.0
if confidence < 0.40:
    final_score = score × 0.5  # 50% penalty
```

### Color-Coded Priority System

| Score Range | Label | Color | Action |
|-------------|-------|-------|--------|
| 80-100 | Yüksek Fırsat (High Opportunity) | 🟢 Green | Reach out immediately / request documents |
| 65-79 | İzlenecek (Worth Watching) | 🔵 Blue | Add to watchlist, show in weekly report |
| 50-64 | Şartlı İlgi (Conditional Interest) | 🟡 Yellow | If tender: track bidding; else: seek partners |
| 0-49 | Düşük Alaka (Low Relevance) | ⚪ Gray | Archive, keep for search only |

### Example Calculation

**Article:** "BMW relocates Munich production line to Debrecen, Hungary - Process will complete in Q1 2026 (Source: Reuters)"

**Extracted Data:**
- event_type = relocation
- company = "BMW"
- from_location = "Munich, Germany"
- to_location = "Debrecen, Hungary"
- sector = "automotive"
- timeline = "Q1 2026" (~6 months)
- source = Reuters

**Component Scores:**
```
E = 1.00 (relocation)
A = 1.00 (all 4 fields clear: 0.40 + 0.25 + 0.25 + 0.10)
G = 1.00 (Germany → Hungary, both in Europe)
T = 1.00 (within 6 months)
C = 0.85 (Reuters, premium news agency)

Score = 100 × (0.30×1.00 + 0.25×1.00 + 0.20×1.00 + 0.15×1.00 + 0.10×0.85)
Score = 100 × (0.30 + 0.25 + 0.20 + 0.15 + 0.085)
Score = 100 × 0.985 = 98.5 → 99 (rounded)

Confidence = 5/5 = 1.00 (no penalty applied)
Label: Yüksek Fırsat (🟢 Green)
Action: reach_out
```

---

## 📁 Project Structure

```
EU_News_Analyze_Agent/
├── backend/                      # FastAPI Backend
│   ├── main.py                  # Application entry point & startup
│   ├── database.py              # SQLAlchemy configuration
│   ├── requirements.txt         # Python dependencies
│   ├── reset_database.py        # Database reset utility
│   │
│   ├── models/                  # Database Models (SQLAlchemy)
│   │   ├── article.py          # Article model
│   │   ├── article_note.py     # Note model
│   │   └── rss_source.py       # RSS source model
│   │
│   ├── routers/                 # API Endpoints
│   │   ├── article_routes.py   # Article CRUD & refresh
│   │   ├── note_routes.py      # Note management
│   │   └── rss_routes.py       # RSS source management
│   │
│   ├── schemas/                 # Pydantic Schemas (Validation)
│   │   ├── article_schema.py   # Article request/response schemas
│   │   ├── note_schema.py      # Note schemas
│   │   └── rss_source_schema.py # RSS source schemas
│   │
│   ├── services/                # Business Logic
│   │   ├── llm_service.py      # Gemini AI integration
│   │   ├── score_service.py    # BIOS-Fit scoring algorithm
│   │   ├── rss_service.py      # RSS feed fetching & parsing
│   │   ├── dedup_service.py    # Duplicate detection
│   │   └── stats_service.py    # Dashboard statistics
│   │
│   └── seed/                    # Database Seeding
│       └── seed_rss_sources.py # Initial RSS sources
│
├── frontend/                     # Next.js Frontend
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard page
│   │   └── news/[id]/          # Article detail page
│   │
│   ├── components/              # React Components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── theme-provider.tsx  # Theme management
│   │
│   ├── lib/                     # Utilities
│   │   ├── api.ts              # Backend API client
│   │   └── utils.ts            # Helper functions
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   ├── use-toast.ts        # Toast notifications
│   │   └── use-mobile.ts       # Responsive detection
│   │
│   ├── public/                  # Static Assets
│   ├── package.json             # Node dependencies
│   └── tsconfig.json            # TypeScript config
│
├── .env.example                  # Environment template
├── docker-compose.yml            # Docker configuration
└── README.md                     # This file
```

---

## 🔌 API Endpoints

### RSS Sources
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rss-sources` | Create new RSS source |
| `GET` | `/api/rss-sources` | List all RSS sources |
| `DELETE` | `/api/rss-sources/{id}` | Delete RSS source |

### Articles
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/articles/refresh` | Fetch and analyze new articles from all sources |
| `GET` | `/api/articles` | List articles with optional filters (search, event_type, score, limit) |
| `GET` | `/api/articles/{id}` | Get detailed article information |
| `PUT` | `/api/articles/{id}` | Update article (mark as read, etc.) |
| `DELETE` | `/api/articles/{id}` | Delete article and associated notes |
| `GET` | `/api/stats` | Get dashboard statistics |
| `GET` | `/api/articles/{id}/score-breakdown` | Get detailed score calculation |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/articles/{id}/notes` | Get all notes for an article |
| `POST` | `/api/articles/{id}/notes` | Create new note |
| `PUT` | `/api/notes/{id}` | Update existing note |
| `DELETE` | `/api/notes/{id}` | Delete note |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/docs` | Interactive Swagger API documentation |
| `GET` | `/redoc` | ReDoc API documentation |

**Full Interactive Documentation:** http://localhost:8000/docs

---

## 🛠️ Technology Stack

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115.0 | Modern async web framework |
| **Python** | 3.11+ | Programming language |
| **SQLAlchemy** | 2.0.36 | ORM for database operations |
| **SQLite** | - | Lightweight database (MVP) |
| **Pydantic** | 2.10.3 | Data validation and serialization |
| **Groq** | 0.13.1 | LLM API client (Llama 3.3 70B Versatile) |
| **feedparser** | 6.0.11 | RSS/Atom feed parsing |
| **httpx** | 0.28.1 | Async HTTP client |
| **uvicorn** | 0.32.0 | ASGI server |

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2 | React framework with App Router |
| **React** | 19 | UI library |
| **TypeScript** | 5.7.3 | Type-safe JavaScript |
| **Tailwind CSS** | 4.2 | Utility-first CSS framework |
| **shadcn/ui** | - | High-quality React components |
| **Radix UI** | - | Accessible component primitives |
| **Lucide React** | 0.564 | Icon library |
| **next-themes** | 0.4.6 | Dark/light theme support |
| **Recharts** | 2.15.0 | Chart library |
| **Sonner** | 1.7.1 | Toast notifications |
| **Zod** | 3.24.1 | Schema validation |

### Development Tools
- **Docker** - Containerization
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 🌱 Default RSS Sources

The system comes pre-configured with 12 European business news sources:

| Source | Focus Area | Type |
|--------|------------|------|
| **EU Startups** | European startup ecosystem | Industry |
| **EU Business News** | European business developments | General |
| **ECSB Research Blog** | Small business research | Academic |
| **The European** | European affairs and business | General |
| **European Business Magazine** | Business news and insights | Industry |
| **European Business Review** | Business analysis | Industry |
| **Entrepreneur** | Entrepreneurship and startups | General |
| **Fast Company** | Innovation and technology | General |
| **Small Business Trends** | SME news and trends | Industry |
| **Inc. Magazine** | Business growth and leadership | General |
| **TechCrunch** | Technology and startups | Tech |
| **VentureBeat** | Tech and business news | Tech |

*Sources are automatically seeded on first backend startup. You can add custom sources through the UI or API.*

---

## 🔐 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Required: Groq API Key
GROQ_API_KEY=your_groq_api_key_here

# Database Configuration
DATABASE_URL=sqlite:///./industrial_news.db

# CORS Configuration (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
```

**Get Groq API Key:**
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in with your account
3. Navigate to API Keys section
4. Create new API key
5. Copy and paste into `.env` file

**Why Groq?**
- **Fast**: Extremely low latency inference
- **Free Tier**: Generous free quota for development
- **Powerful**: Llama 3.3 70B model with excellent reasoning
- **Reliable**: High availability and uptime

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Database Management

**Reset Database (Clear all data):**
```bash
cd backend
python reset_database.py
```

**Database Location:**
- Development: `backend/industrial_news.db`
- Tables: `articles`, `rss_sources`, `article_notes`

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Backend won't start**
```bash
# Check Python version (need 3.11+)
python --version

# Ensure virtual environment is activated
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Problem: LLM analysis fails**
- Verify `GROQ_API_KEY` is set in `.env`
- Check API key is valid at [Groq Console](https://console.groq.com/)
- Check API quota at Groq Console (free tier has limits)
- System will use fallback keyword-based analysis if LLM fails
- If quota exhausted, article processing will pause until quota resets

**Problem: Database errors**
```bash
# Reset database
cd backend
python reset_database.py
```

### Frontend Issues

**Problem: Frontend won't start**
```bash
# Check Node version (need 18+)
node --version

# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

**Problem: Can't connect to backend**
- Verify backend is running at http://localhost:8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS settings in backend `.env`

**Problem: No articles showing**
1. Ensure RSS sources are added (check sidebar)
2. Click "🔄 Yenile" button to fetch articles
3. Wait 2-5 minutes for initial fetch
4. Check browser console for errors

### Common Issues

**CORS Errors:**
- Add your frontend URL to `CORS_ORIGINS` in backend `.env`
- Restart backend after changing `.env`

**Port Already in Use:**
```bash
# Backend (port 8000)
uvicorn main:app --reload --port 8001

# Frontend (port 3000)
npm run dev -- -p 3001
```

---

## 📈 Performance & Scalability

### Current Performance (MVP)
- **Article Fetching:** 2-5 minutes for 12 RSS sources
- **AI Analysis:** 1-2 seconds per article
- **Database:** SQLite (suitable for 50-200 articles per refresh)
- **Concurrent Users:** 10-20 (development mode)

### Production Recommendations

**Database:**
- Migrate from SQLite to **PostgreSQL** or **MySQL**
- Add database indexing for faster queries
- Implement connection pooling

**Caching:**
- Add **Redis** for caching API responses
- Cache RSS feed results (15-30 minutes)
- Cache AI analysis results

**Scalability:**
- Use **Celery** for async task processing
- Implement background job queue for RSS fetching
- Add rate limiting for API endpoints

**Deployment:**
- **Backend:** Railway, Render, Fly.io, or AWS
- **Frontend:** Vercel, Netlify, or AWS Amplify
- **Database:** Managed PostgreSQL (AWS RDS, Supabase)
- **LLM:** Groq API (ensure API key is set in production environment)

**Monitoring:**
- Add application logging (Sentry, LogRocket)
- Monitor API performance (New Relic, DataDog)
- Track Groq API usage and quota limits

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

### Backend Deployment (Railway/Render/Fly.io)

1. **Prepare for deployment:**
   ```bash
   cd backend
   # Ensure requirements.txt is up to date
   pip freeze > requirements.txt
   ```

2. **Set environment variables:**
   - `GROQ_API_KEY` - Your Groq API key
   - `DATABASE_URL` - PostgreSQL connection string
   - `CORS_ORIGINS` - Your frontend URL

3. **Deploy:**
   - Connect GitHub repository
   - Select `backend` directory
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Vercel)

1. **Connect repository:**
   - Import project from GitHub
   - Select `frontend` directory as root

2. **Configure build settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set environment variables:**
   - `NEXT_PUBLIC_API_URL` - Your backend API URL

4. **Deploy:**
   - Automatic deployment on git push
   - Preview deployments for pull requests

### Production Checklist

- [ ] Migrate to PostgreSQL database
- [ ] Set up proper environment variables
- [ ] Configure CORS for production domains
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Add rate limiting
- [ ] Review and update API keys
- [ ] Test all features in production
- [ ] Set up CI/CD pipeline

---

## 🤝 Contributing

Contributions are welcome! This project was built for BSMT Hackathon 2026 and is open for improvements.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/EU_News_Analyze_Agent.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Development Guidelines

- **Code Style:** Follow PEP 8 for Python, ESLint for TypeScript
- **Commits:** Use conventional commit messages (feat, fix, docs, refactor)
- **Testing:** Test your changes locally before submitting
- **Documentation:** Update README if adding new features

### Areas for Improvement

- [ ] Add unit tests for backend services
- [ ] Add E2E tests for frontend
- [ ] Improve AI prompt engineering
- [ ] Add more RSS sources
- [ ] Implement user authentication
- [ ] Add export functionality (CSV, PDF)
- [ ] Improve mobile responsiveness
- [ ] Add email notifications
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 BSMT Hackathon Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👥 Team & Credits

### BSMT Hackathon 2026 Team
- **Backend Development** - FastAPI, AI Integration, BIOS-Fit Algorithm
- **Frontend Development** - Next.js, UI/UX Design, Component Architecture
- **System Design** - Architecture, Database Design, API Design

### Acknowledgments

- **Groq** - Ultra-fast LLM inference with Llama 3.3 70B
- **Meta AI** - Llama 3.3 language model
- **FastAPI** - Modern Python web framework
- **Next.js** - React framework for production
- **shadcn/ui** - Beautiful and accessible UI components
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **RSS Feed Providers** - European business news sources

---

## 📞 Support & Contact

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/UKBey/EU_News_Analyze_Agent/issues)
- **Discussions:** [GitHub Discussions](https://github.com/UKBey/EU_News_Analyze_Agent/discussions)
- **API Documentation:** http://localhost:8000/docs (when running locally)

### Reporting Bugs

When reporting bugs, please include:
- Operating system and version
- Python/Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs

### Feature Requests

We welcome feature requests! Please:
- Check existing issues first
- Describe the feature and use case
- Explain why it would be valuable
- Consider contributing the feature yourself

---

## 📊 Project Status

**Status:** ✅ Production-Ready MVP  
**Version:** 1.0.0  
**Last Updated:** May 3, 2026  
**Hackathon:** BSMT Hackathon 2026

### Roadmap

- [x] Core RSS aggregation system
- [x] AI-powered article analysis
- [x] BIOS-Fit scoring algorithm
- [x] Modern web interface
- [x] Note-taking functionality
- [ ] User authentication system
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Comprehensive test coverage

---

<div align="center">

**Built with ❤️ for tracking European industrial opportunities**

⭐ Star this repo if you find it useful!

[Report Bug](https://github.com/UKBey/EU_News_Analyze_Agent/issues) · [Request Feature](https://github.com/UKBey/EU_News_Analyze_Agent/issues) · [Documentation](https://github.com/UKBey/EU_News_Analyze_Agent)

</div>
