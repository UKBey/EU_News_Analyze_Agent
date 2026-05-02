# 🏭 European Industrial News Scanning Agent

AI-powered RSS news aggregation and analysis system for tracking European industrial relocations, expansions, and business opportunities.

**🏆 Built for BSMT Hackathon 2026**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Overview

This application automatically:
- 📡 Fetches news from 12+ European business RSS sources
- 🤖 Analyzes articles with Gemini LLM
- 📊 Calculates BIOS-Fit relevance scores (0-100)
- 🎨 Categorizes by color (Green/Blue/Yellow/Gray)
- 🌐 Displays in a modern web interface

**Perfect for:** Investment firms, business development teams, and market researchers tracking European industrial movements.

---

## ✨ Features

### Backend (FastAPI + SQLite)
- ✅ RSS feed management (add, delete, refresh)
- ✅ LLM-powered article analysis (Gemini 1.5 Flash)
- ✅ BIOS-Fit scoring algorithm
- ✅ Duplicate prevention with content hashing
- ✅ Advanced search and filtering
- ✅ RESTful API with Swagger UI
- ✅ Automatic RSS source seeding

### Frontend (Next.js + TypeScript)
- ✅ Modern, responsive UI with dark/light themes
- ✅ Real-time article display with color-coded priorities
- ✅ Search and filter by event type, score, source
- ✅ Auto-refresh with countdown
- ✅ Company timeline visualization
- ✅ Featured news section

### AI & Scoring
- ✅ Event type classification (relocation, expansion, closure, etc.)
- ✅ Entity extraction (company, locations, sector)
- ✅ Turkish summary generation
- ✅ Multi-factor scoring (Event, Actor, Geography, Time, Source)
- ✅ Confidence-based penalty system

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ or pnpm
- Gemini API key ([Get one here](https://ai.google.dev/))

### 1. Clone Repository
```bash
git clone https://github.com/UKBey/EU_News_Analyze_Agent.git
cd EU_News_Analyze_Agent
```

### 2. Setup Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start backend
uvicorn main:app --reload
```

Backend runs at: **http://localhost:8000**
Swagger UI: **http://localhost:8000/docs**

### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
pnpm install
# or: npm install

# Start development server
pnpm dev
# or: npm run dev
```

Frontend runs at: **http://localhost:3000**

### 4. Use the Application
1. Open http://localhost:3000
2. RSS sources are auto-loaded on backend startup
3. Click **"🔄 Yenile"** to fetch and analyze articles
4. Browse, search, and filter articles by score and type

---

## 📊 BIOS-Fit Scoring System

Articles are scored 0-100 based on:

```
Score = 100 × (0.30E + 0.25A + 0.20G + 0.15T + 0.10C)
```

**Components:**
- **E (30%)**: Event Type (relocation=1.0, new_plant=0.9, expansion=0.75, etc.)
- **A (25%)**: Actor Clarity (company, locations, sector completeness)
- **G (20%)**: Geography (Europe=1.0, unknown=0.3)
- **T (15%)**: Time Window (specified=0.8, unspecified=0.3)
- **C (10%)**: Source Trust (premium=0.85, industry=0.7, general=0.55)

**Color Labels:**
- 🟢 **Green (80-100)**: High opportunity - immediate action
- 🔵 **Blue (65-79)**: Worth watching - monitor developments
- 🟡 **Yellow (50-64)**: Conditional interest - needs more info
- ⚪ **Gray (0-49)**: Low relevance - archive

See [SCORING_DOCUMENTATION.md](backend/SCORING_DOCUMENTATION.md) for detailed examples.

---

## 📁 Project Structure

```
EU_News_Analyze_Agent/
├── backend/                    # FastAPI backend
│   ├── main.py                # Application entry point
│   ├── database.py            # SQLAlchemy configuration
│   ├── models/                # Database models
│   ├── routers/               # API endpoints
│   ├── services/              # Business logic
│   │   ├── llm_service.py    # Gemini LLM integration
│   │   ├── score_service.py  # BIOS-Fit scoring
│   │   └── rss_service.py    # RSS fetching
│   ├── seed/                  # RSS source seeding
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # Next.js 14 App Router
│   ├── components/            # React components
│   ├── lib/                   # API client and utilities
│   └── package.json           # Node dependencies
│
├── scoring/                    # Original scoring scripts
│   ├── llm_service.py         # LLM analysis
│   ├── score_service.py       # Scoring algorithm
│   └── rss_links.txt          # RSS source list
│
└── docs/                       # Documentation
    ├── INTEGRATION_GUIDE.md
    ├── SCORING_DOCUMENTATION.md
    └── QUICK_SETUP.md
```

---

## 🔌 API Endpoints

### RSS Sources
- `POST /api/rss-sources` - Create RSS source
- `GET /api/rss-sources` - List all sources
- `DELETE /api/rss-sources/{id}` - Delete source

### Articles
- `POST /api/articles/refresh` - Fetch and analyze articles
- `GET /api/articles` - List articles (with filters)
- `GET /api/articles/{id}` - Get article detail
- `GET /api/stats` - Dashboard statistics

### Health
- `GET /api/health` - Server status

Full API documentation: **http://localhost:8000/docs**

---

## 🧪 Testing

### Backend
```bash
cd backend
python test_api.py
```

### Manual Testing
1. Open Swagger UI: http://localhost:8000/docs
2. Try each endpoint interactively
3. Check responses and schemas

---

## 📚 Documentation

- [Backend README](backend/README.md) - Backend setup and API
- [Frontend README](frontend/README.md) - Frontend setup and development
- [API Guide](backend/API_GUIDE.md) - Complete API reference
- [Scoring Documentation](backend/SCORING_DOCUMENTATION.md) - Scoring system details
- [AI Integration Guide](backend/AI_INTEGRATION_GUIDE.md) - LLM integration
- [Integration Summary](SCORING_INTEGRATION_SUMMARY.md) - System overview
- [Quick Setup](QUICK_SETUP.md) - 5-minute setup guide

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.115
- **Database**: SQLite with SQLAlchemy ORM
- **LLM**: Google Gemini 1.5 Flash
- **RSS**: feedparser
- **Validation**: Pydantic

### Frontend
- **Framework**: Next.js 16.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.2
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light)

---

## 🌱 RSS Sources

12 European business news sources included:
- EU Startups
- EU Business News
- ECSB Research Blog
- The European
- European Business Magazine
- European Business Review
- Entrepreneur
- Fast Company
- Small Business Trends
- Inc. Magazine
- TechCrunch
- VentureBeat

---

## 🔐 Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./industrial_news.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.11+)
- Activate virtual environment
- Install dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Install dependencies: `pnpm install` or `npm install`
- Clear cache: `rm -rf .next node_modules`

### LLM analysis fails
- Check GEMINI_API_KEY in .env
- Verify API key is valid
- Backend will use fallback analysis if LLM fails

### No articles after refresh
- Check RSS sources are active
- Try refreshing again
- Run `python backend/reset_database.py` if you want a clean slate

---

## 📈 Performance

- **Article Fetch**: ~2-5 minutes for 12 sources
- **LLM Analysis**: ~1-2 seconds per article
- **Database**: SQLite (suitable for MVP, use PostgreSQL for production)
- **Expected Load**: 50-200 articles per refresh

---

## 🚀 Deployment

### Backend (Railway/Render/Fly.io)
1. Deploy FastAPI backend
2. Set environment variables (GEMINI_API_KEY)
3. Use PostgreSQL for production

### Frontend (Vercel)
1. Connect GitHub repository
2. Set NEXT_PUBLIC_API_URL
3. Deploy automatically on push

---

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👥 Team

**BSMT Hackathon 2026**
- Backend & AI Integration
- Frontend Development
- Scoring System Design

---

## 🙏 Acknowledgments

- Google Gemini API for LLM capabilities
- FastAPI for excellent backend framework
- Next.js for modern frontend development
- shadcn/ui for beautiful components
- All RSS sources for providing news feeds

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/UKBey/EU_News_Analyze_Agent/issues)
- **Documentation**: See `/docs` folder
- **API Docs**: http://localhost:8000/docs

---

**Built with ❤️ for tracking European industrial opportunities**

**Status**: ✅ Production-ready MVP
**Last Updated**: May 2, 2026
**Version**: 1.0.0
