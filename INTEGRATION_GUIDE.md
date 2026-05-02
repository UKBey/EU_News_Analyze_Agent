# Frontend-Backend Integration Guide

## 🎯 Overview

This guide explains how the Next.js frontend connects to the FastAPI backend.

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

Backend runs at: **http://localhost:8000**

### 2. Start Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at: **http://localhost:3000**

---

## 🔌 API Integration

### Configuration

Frontend API URL is configured in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### API Client

Located in `frontend/lib/api.ts`:

```typescript
import { api } from '@/lib/api'

// Get RSS sources
const sources = await api.getRSSSources()

// Create RSS source
await api.createRSSSource({ 
  name: "TechCrunch", 
  url: "https://techcrunch.com/feed/" 
})

// Refresh articles
const result = await api.refreshArticles()

// Get articles with filters
const articles = await api.getArticles({
  search: "tesla",
  event_type: "expansion",
  min_score: 70,
  limit: 50
})

// Get single article
const article = await api.getArticle(1)

// Get stats
const stats = await api.getStats()
```

---

## 📊 Data Flow

### 1. RSS Source Management

```
Frontend                    Backend
--------                    -------
User clicks "Add Source"
  ↓
api.createRSSSource()  →   POST /api/rss-sources
  ↓                         ↓
Validate URL                Validate RSS feed
  ↓                         ↓
Show toast                  Save to database
  ↓                         ↓
Reload sources         ←    Return source object
```

### 2. Article Refresh

```
Frontend                    Backend
--------                    -------
User clicks "Refresh"
  ↓
api.refreshArticles()  →   POST /api/articles/refresh
  ↓                         ↓
Show loading                Fetch from all RSS sources
  ↓                         ↓
Wait for response           Parse articles
  ↓                         ↓
Show toast with stats  ←    Check duplicates
  ↓                         ↓
Reload articles             Save new articles
                            ↓
                            Return summary
```

### 3. Article Display

```
Frontend                    Backend
--------                    -------
Page loads
  ↓
api.getArticles()      →   GET /api/articles?limit=100
  ↓                         ↓
Show loading                Query database
  ↓                         ↓
Convert backend format      Apply filters
  ↓                         ↓
Display articles       ←    Return paginated results
```

---

## 🔄 Type Conversion

Backend and frontend use different data structures. The API client handles conversion:

### Backend Article Type
```typescript
interface BackendArticle {
  id: number
  source_id: number
  source_name: string
  title: string
  link: string
  published_at: string | null
  raw_summary: string | null
  event_type: string
  summary_tr: string | null
  company: string | null
  from_location: string | null
  to_location: string | null
  sector: string | null
  score: number
  confidence: number
  action_label: string | null
  color_label: string | null
  created_at: string
}
```

### Frontend News Type
```typescript
interface NewsItem {
  id: number
  title: string
  source: string
  date: string
  event_type: "relocation" | "new_plant" | "expansion" | "closure"
  summary_tr: string
  company: string
  from_location: string | null
  to_location: string | null
  sector: string
  score: number
  image: string
  full_content: string
  link: string
}
```

### Conversion Function
```typescript
export function convertBackendArticle(article: BackendArticle): NewsItem {
  return {
    id: article.id,
    title: article.title,
    source: article.source_name,
    date: article.published_at || article.created_at,
    event_type: article.event_type as EventType,
    summary_tr: article.summary_tr || article.raw_summary || '',
    company: article.company || 'Unknown',
    from_location: article.from_location,
    to_location: article.to_location,
    sector: article.sector || 'Unknown',
    score: article.score,
    image: getPlaceholderImage(article.event_type),
    full_content: article.raw_summary || '',
    link: article.link,
  }
}
```

---

## 🎨 UI Components

### Dashboard (`app/page.tsx`)

**Features:**
- RSS source management sidebar
- Article list with filters
- Search functionality
- Auto-refresh toggle
- Theme toggle
- Company timeline

**API Calls:**
- `loadRSSSources()` - On mount
- `loadNews()` - On mount and after refresh
- `addRssSource()` - When adding source
- `removeRssSource()` - When deleting source
- `fetchNews()` - When clicking refresh

### News Detail (`app/news/[id]/page.tsx`)

**Features:**
- Full article view
- Score visualization
- Location information
- Related news
- External link

**API Calls:**
- `api.getArticle(id)` - On mount
- `api.getArticles({ event_type })` - For related news

---

## 🔔 Error Handling

### Toast Notifications

```typescript
import { toast } from 'sonner'

// Success
toast.success('RSS kaynagi basariyla eklendi')

// Error
toast.error('RSS kaynagi eklenemedi')

// Info
toast.info('Haberler yenileniyor...')
```

### Try-Catch Pattern

```typescript
try {
  const result = await api.refreshArticles()
  toast.success(`${result.new_articles} yeni haber eklendi`)
  await loadNews()
} catch (error: any) {
  console.error('Failed to refresh:', error)
  toast.error(error.message || 'Haberler yenilenemedi')
}
```

---

## 🎯 Event Types

Both frontend and backend use the same event types:

| Value | Turkish | English | Icon |
|-------|---------|---------|------|
| `relocation` | Taşınma | Relocation | 📦 |
| `new_plant` | Yeni Tesis | New Plant | 🏭 |
| `expansion` | Genişleme | Expansion | 📈 |
| `closure` | Kapanış | Closure | 🔒 |
| `tender` | İhale | Tender | 📋 |
| `other` | Diğer | Other | 📰 |

---

## 📊 Score System

| Range | Label (TR) | Label (EN) | Color |
|-------|------------|------------|-------|
| 80-100 | Yüksek Fırsat | High Opportunity | Green |
| 65-79 | İzlenecek | Worth Watching | Blue |
| 50-64 | Şartlı İlgi | Conditional | Yellow |
| 0-49 | Düşük Alaka | Low Relevance | Gray |

---

## 🔧 CORS Configuration

Backend CORS is configured in `backend/main.py`:

```python
cors_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch"

**Cause**: Backend not running or wrong URL

**Solution**:
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Check `.env.local` has correct URL
3. Restart frontend: `pnpm dev`

### Issue: CORS Error

**Cause**: Frontend URL not in CORS whitelist

**Solution**:
1. Add your frontend URL to `backend/main.py`
2. Restart backend

### Issue: "RSS source already exists"

**Cause**: Duplicate URL

**Solution**:
- Backend prevents duplicate RSS URLs
- Delete existing source first or use different URL

### Issue: No articles showing

**Cause**: No RSS sources or articles not refreshed

**Solution**:
1. Add RSS sources
2. Click "Refresh" button
3. Wait for articles to be fetched

---

## 📝 Testing Workflow

### 1. Test Backend Health
```bash
curl http://localhost:8000/api/health
```

Expected:
```json
{
  "status": "ok",
  "message": "Industrial News Agent backend is running"
}
```

### 2. Test Adding RSS Source

In frontend:
1. Enter name: "TechCrunch"
2. Enter URL: "https://techcrunch.com/feed/"
3. Click "Add"
4. Should see success toast
5. Source appears in sidebar

### 3. Test Refreshing Articles

1. Click "Refresh" button
2. Should see loading spinner
3. Toast shows: "X yeni haber eklendi"
4. Articles appear in main area

### 4. Test Filtering

1. Enter search term: "tesla"
2. Select event type: "expansion"
3. Select score: "High (80-100)"
4. Articles filter in real-time

### 5. Test Article Detail

1. Click on any article card
2. Should navigate to `/news/{id}`
3. Full article details load
4. Related news shown in sidebar

---

## 🚀 Production Deployment

### Backend (Railway/Render/Fly.io)

1. Deploy FastAPI backend
2. Get production URL (e.g., `https://api.yourdomain.com`)
3. Update CORS to include frontend URL

### Frontend (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   ```
4. Deploy

---

## 📚 Additional Resources

- [Backend API Guide](backend/API_GUIDE.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [AI Integration Guide](backend/AI_INTEGRATION_GUIDE.md)

---

## ✅ Integration Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] `.env.local` configured
- [ ] CORS configured in backend
- [ ] Can add RSS sources
- [ ] Can refresh articles
- [ ] Can search and filter
- [ ] Can view article details
- [ ] Toast notifications working
- [ ] Theme toggle working
- [ ] Auto-refresh working

---

**Integration complete! Your frontend and backend are now connected.** 🎉
