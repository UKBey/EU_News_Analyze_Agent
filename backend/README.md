# European Industrial News Scanning Agent - Backend

RSS-based, AI-supported industrial news scanning web application backend built with FastAPI and SQLite.

**🤖 NEW: Integrated with Gemini LLM for automatic article analysis and BIOS-Fit scoring!**

**📊 See [SCORING_DOCUMENTATION.md](SCORING_DOCUMENTATION.md) for detailed scoring system explanation.**

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)

### Installation & Running

**Important**: Create `.env` file with your Gemini API key:
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

#### Windows
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Linux/Mac
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Access the API

- **API Base URL**: http://localhost:8000/api
- **Swagger UI (Interactive Docs)**: http://localhost:8000/docs
- **ReDoc (Alternative Docs)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/health

## 📁 Project Structure

```
backend/
│
├── main.py                 # FastAPI application entry point
├── database.py             # SQLAlchemy database configuration
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
│
├── models/                # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── rss_source.py     # RSS source model
│   └── article.py        # Article model
│
├── schemas/               # Pydantic schemas for validation
│   ├── __init__.py
│   ├── rss_source_schema.py
│   └── article_schema.py
│
├── routers/               # API route handlers
│   ├── __init__.py
│   ├── rss_routes.py     # RSS source endpoints
│   └── article_routes.py # Article endpoints
│
├── services/              # Business logic services
│   ├── __init__.py
│   ├── rss_service.py    # RSS fetching and validation
│   ├── dedup_service.py  # Duplicate detection
│   └── stats_service.py  # Dashboard statistics
│
└── seed/                  # Database seeding
    ├── __init__.py
    └── demo_sources.py    # Demo RSS sources
```

## 🗄️ Database Schema

### Tables

#### rss_sources
- `id`: Primary key
- `name`: Source name
- `url`: RSS feed URL (unique)
- `category`: Optional category
- `is_active`: Active status (default: true)
- `last_fetched_at`: Last fetch timestamp
- `created_at`: Creation timestamp

#### articles
- `id`: Primary key
- `source_id`: Foreign key to rss_sources
- `source_name`: Source name (denormalized)
- `title`: Article title
- `link`: Article URL
- `published_at`: Publication date
- `raw_summary`: Original summary
- `content_hash`: Unique hash (title + link)
- **AI Fields** (filled by AI teammate later):
  - `event_type`: Event classification
  - `summary_tr`: Turkish summary
  - `company`: Company name
  - `from_location`: Origin location
  - `to_location`: Destination location
  - `sector`: Industry sector
  - `score`: Relevance score (0-100)
  - `confidence`: AI confidence (0.0-1.0)
  - `action_label`: Action recommendation
  - `color_label`: UI color indicator
- `created_at`: Creation timestamp

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```
Returns API status.

### RSS Sources

#### Create RSS Source
```
POST /api/rss-sources
Content-Type: application/json

{
  "name": "Reuters Business",
  "url": "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
  "category": "business"
}
```

#### List RSS Sources
```
GET /api/rss-sources
```

#### Delete RSS Source
```
DELETE /api/rss-sources/{source_id}
```
Deletes source and all related articles (cascade).

### Articles

#### Refresh Articles
```
POST /api/articles/refresh
```
Fetches new articles from all active RSS sources. Prevents duplicates using content hash.

**Response:**
```json
{
  "message": "Refresh completed",
  "sources_checked": 3,
  "new_articles": 12,
  "duplicates_skipped": 5,
  "errors": []
}
```

#### List Articles
```
GET /api/articles?search=tesla&event_type=expansion&min_score=70&source_id=1&limit=50&offset=0
```

**Query Parameters:**
- `search`: Search in title, summary, company, sector
- `event_type`: Filter by event type
- `min_score`: Minimum score filter
- `source_id`: Filter by source
- `limit`: Items per page (default: 50, max: 200)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "total": 120,
  "limit": 50,
  "offset": 0,
  "items": [...]
}
```

#### Get Article Detail
```
GET /api/articles/{article_id}
```

#### Get Dashboard Statistics
```
GET /api/stats
```

**Response:**
```json
{
  "source_count": 5,
  "article_count": 140,
  "high_score_count": 12,
  "event_type_distribution": {
    "relocation": 10,
    "closure": 4,
    "expansion": 18,
    "new_plant": 7,
    "tender": 3,
    "other": 98
  },
  "last_refresh_at": "2024-01-15T10:30:00"
}
```

## 🔄 API Flow

### 1. Initial Setup
1. Start the backend server
2. Database tables are created automatically
3. (Optional) Seed demo RSS sources

### 2. Add RSS Sources
Frontend calls `POST /api/rss-sources` to add news sources.

### 3. Fetch Articles
Frontend calls `POST /api/articles/refresh` to fetch articles from all sources.

### 4. Browse Articles
Frontend calls `GET /api/articles` with filters to display articles.

### 5. View Details
Frontend calls `GET /api/articles/{id}` to show full article details.

### 6. Dashboard
Frontend calls `GET /api/stats` to display statistics.

## 🤖 For AI/RSS Teammate

Articles are stored with default AI field values:
- `event_type`: "other"
- `summary_tr`: raw_summary or "AI analysis pending"
- `score`: 0
- `confidence`: 0.0
- `action_label`: "Düşük Alaka"
- `color_label`: "gray"

### To Update AI Fields

After LLM analysis, update articles using SQLAlchemy:

```python
from database import SessionLocal
from models import Article

db = SessionLocal()

# Get article
article = db.query(Article).filter(Article.id == article_id).first()

# Update AI fields
article.event_type = "expansion"
article.summary_tr = "Türkçe özet..."
article.company = "Tesla"
article.to_location = "Berlin"
article.sector = "Automotive"
article.score = 85
article.confidence = 0.92
article.action_label = "Yüksek Fırsat"
article.color_label = "green"

db.commit()
```

### Event Types
- `relocation`: Company relocation
- `closure`: Factory/office closure
- `expansion`: Business expansion
- `new_plant`: New facility opening
- `tender`: Government/corporate tender
- `other`: Other news

### Score Ranges
- 0-30: Low relevance (gray)
- 31-69: Medium relevance (yellow)
- 70-100: High relevance (green)

## 🌱 Seeding Demo Data

To seed demo RSS sources, uncomment lines in `main.py`:

```python
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_demo_sources(db)
    finally:
        db.close()
```

Or run manually:
```python
from database import SessionLocal
from seed import seed_demo_sources

db = SessionLocal()
seed_demo_sources(db)
db.close()
```

## 🔧 Configuration

Copy `.env.example` to `.env` and customize:

```env
DATABASE_URL=sqlite:///./industrial_news.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

## 🧪 Testing with Swagger UI

1. Open http://localhost:8000/docs
2. Try the health check endpoint
3. Create an RSS source
4. Refresh articles
5. List articles with filters
6. View statistics

## 📝 Notes

- This is a hackathon MVP - optimized for speed and simplicity
- No authentication implemented
- SQLite is used for simplicity (single file database)
- CORS is enabled for local frontend development
- Duplicate articles are prevented using content hash (title + link)
- Failed RSS sources don't crash the entire refresh operation
- Cascade delete: deleting a source removes all its articles

## 🐛 Troubleshooting

### Port already in use
```bash
# Use a different port
uvicorn main:app --reload --port 8001
```

### Module not found
```bash
# Make sure virtual environment is activated
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Database locked
SQLite can have locking issues with concurrent writes. For production, consider PostgreSQL.

## 🚀 Production Deployment

For production deployment:
1. Use PostgreSQL instead of SQLite
2. Add authentication/authorization
3. Add rate limiting
4. Use environment variables for sensitive data
5. Enable HTTPS
6. Add logging and monitoring
7. Use a production ASGI server (e.g., gunicorn with uvicorn workers)

## 📚 Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight database
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server
- **feedparser**: RSS/Atom feed parser
- **httpx**: HTTP client

## 👥 Team Integration

### Frontend Developer
- Use Swagger UI at http://localhost:8000/docs for API testing
- All endpoints return JSON
- CORS is configured for local development
- Use the provided schemas for TypeScript types

### AI/RSS Developer
- Articles are pre-stored with default AI fields
- Update AI fields after LLM analysis
- Use the Article model directly with SQLAlchemy
- See "For AI/RSS Teammate" section above

## ✅ Ready for Demo

The backend is production-ready for a 24-hour hackathon demo:
- ✅ All required endpoints implemented
- ✅ Database schema with indexes
- ✅ Duplicate prevention
- ✅ Error handling
- ✅ CORS enabled
- ✅ Interactive API documentation
- ✅ Clean, readable code
- ✅ No missing dependencies

Good luck with your hackathon! 🎉
