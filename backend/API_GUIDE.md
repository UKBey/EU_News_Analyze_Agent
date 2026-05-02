# API Usage Guide for Frontend Developer

## Quick Reference

**Base URL**: `http://localhost:8000/api`

**Interactive Docs**: `http://localhost:8000/docs` (Swagger UI - use this for testing!)

## Complete API Endpoints

### 1. Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Industrial News Agent backend is running"
}
```

---

### 2. RSS Source Management

#### Create RSS Source

```http
POST /api/rss-sources
Content-Type: application/json

{
  "name": "TechCrunch",
  "url": "https://techcrunch.com/feed/",
  "category": "technology"
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "name": "TechCrunch",
  "url": "https://techcrunch.com/feed/",
  "category": "technology",
  "is_active": true,
  "last_fetched_at": null,
  "created_at": "2024-01-15T10:30:00"
}
```

**Error Responses:**
- `400`: Invalid RSS URL or URL already exists
- `422`: Validation error (missing required fields)

#### List All RSS Sources

```http
GET /api/rss-sources
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "TechCrunch",
    "url": "https://techcrunch.com/feed/",
    "category": "technology",
    "is_active": true,
    "last_fetched_at": "2024-01-15T10:35:00",
    "created_at": "2024-01-15T10:30:00"
  },
  {
    "id": 2,
    "name": "Reuters Business",
    "url": "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
    "category": "business",
    "is_active": true,
    "last_fetched_at": null,
    "created_at": "2024-01-15T10:32:00"
  }
]
```

#### Delete RSS Source

```http
DELETE /api/rss-sources/1
```

**Success Response (204):** No content

**Error Response:**
- `404`: RSS source not found

**Note:** Deleting a source also deletes all its articles (cascade delete).

---

### 3. Article Management

#### Refresh Articles from All Sources

```http
POST /api/articles/refresh
```

**Response (200):**
```json
{
  "message": "Refresh completed",
  "sources_checked": 3,
  "new_articles": 25,
  "duplicates_skipped": 8,
  "errors": [
    "Reuters Business: Connection timeout"
  ]
}
```

**What it does:**
- Fetches articles from all active RSS sources
- Prevents duplicates using content hash
- Updates `last_fetched_at` for each source
- Continues even if some sources fail
- Returns summary of the operation

#### List Articles with Filters

```http
GET /api/articles?search=tesla&event_type=expansion&min_score=70&source_id=1&limit=20&offset=0
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search in title, summary, company, sector |
| `event_type` | string | No | - | Filter by event type (relocation, closure, expansion, new_plant, tender, other) |
| `min_score` | integer | No | - | Minimum score (0-100) |
| `source_id` | integer | No | - | Filter by RSS source ID |
| `limit` | integer | No | 50 | Items per page (max: 200) |
| `offset` | integer | No | 0 | Pagination offset |

**Response (200):**
```json
{
  "total": 120,
  "limit": 20,
  "offset": 0,
  "items": [
    {
      "id": 1,
      "source_id": 1,
      "source_name": "TechCrunch",
      "title": "Tesla opens new Gigafactory in Berlin",
      "link": "https://techcrunch.com/2024/01/15/tesla-berlin",
      "published_at": "2024-01-15T08:00:00",
      "raw_summary": "Tesla has officially opened its new manufacturing facility...",
      "event_type": "expansion",
      "summary_tr": "Tesla, Berlin'de yeni üretim tesisini açtı...",
      "company": "Tesla",
      "from_location": null,
      "to_location": "Berlin, Germany",
      "sector": "Automotive",
      "score": 85,
      "confidence": 0.92,
      "action_label": "Yüksek Fırsat",
      "color_label": "green",
      "created_at": "2024-01-15T10:35:00"
    }
  ]
}
```

**Frontend Pagination Example:**
```javascript
// Page 1
GET /api/articles?limit=20&offset=0

// Page 2
GET /api/articles?limit=20&offset=20

// Page 3
GET /api/articles?limit=20&offset=40
```

#### Get Single Article

```http
GET /api/articles/1
```

**Response (200):**
```json
{
  "id": 1,
  "source_id": 1,
  "source_name": "TechCrunch",
  "title": "Tesla opens new Gigafactory in Berlin",
  "link": "https://techcrunch.com/2024/01/15/tesla-berlin",
  "published_at": "2024-01-15T08:00:00",
  "raw_summary": "Tesla has officially opened its new manufacturing facility...",
  "event_type": "expansion",
  "summary_tr": "Tesla, Berlin'de yeni üretim tesisini açtı...",
  "company": "Tesla",
  "from_location": null,
  "to_location": "Berlin, Germany",
  "sector": "Automotive",
  "score": 85,
  "confidence": 0.92,
  "action_label": "Yüksek Fırsat",
  "color_label": "green",
  "created_at": "2024-01-15T10:35:00"
}
```

**Error Response:**
- `404`: Article not found

---

### 4. Dashboard Statistics

```http
GET /api/stats
```

**Response (200):**
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
  "last_refresh_at": "2024-01-15T10:35:00"
}
```

**Use this for:**
- Dashboard overview cards
- Event type pie/bar charts
- Last refresh timestamp

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
// types.ts
export interface RSSSource {
  id: number;
  name: string;
  url: string;
  category: string | null;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

export interface Article {
  id: number;
  source_id: number;
  source_name: string;
  title: string;
  link: string;
  published_at: string | null;
  raw_summary: string | null;
  event_type: string;
  summary_tr: string | null;
  company: string | null;
  from_location: string | null;
  to_location: string | null;
  sector: string | null;
  score: number;
  confidence: number;
  action_label: string | null;
  color_label: string | null;
  created_at: string;
}

export interface ArticleListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Article[];
}

export interface DashboardStats {
  source_count: number;
  article_count: number;
  high_score_count: number;
  event_type_distribution: Record<string, number>;
  last_refresh_at: string | null;
}

// api.ts
const API_BASE = 'http://localhost:8000/api';

export const api = {
  // RSS Sources
  async createSource(data: { name: string; url: string; category?: string }) {
    const response = await fetch(`${API_BASE}/rss-sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create source');
    return response.json() as Promise<RSSSource>;
  },

  async listSources() {
    const response = await fetch(`${API_BASE}/rss-sources`);
    if (!response.ok) throw new Error('Failed to fetch sources');
    return response.json() as Promise<RSSSource[]>;
  },

  async deleteSource(id: number) {
    const response = await fetch(`${API_BASE}/rss-sources/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete source');
  },

  // Articles
  async refreshArticles() {
    const response = await fetch(`${API_BASE}/articles/refresh`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to refresh articles');
    return response.json();
  },

  async listArticles(params?: {
    search?: string;
    event_type?: string;
    min_score?: number;
    source_id?: number;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.event_type) query.set('event_type', params.event_type);
    if (params?.min_score) query.set('min_score', params.min_score.toString());
    if (params?.source_id) query.set('source_id', params.source_id.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const response = await fetch(`${API_BASE}/articles?${query}`);
    if (!response.ok) throw new Error('Failed to fetch articles');
    return response.json() as Promise<ArticleListResponse>;
  },

  async getArticle(id: number) {
    const response = await fetch(`${API_BASE}/articles/${id}`);
    if (!response.ok) throw new Error('Failed to fetch article');
    return response.json() as Promise<Article>;
  },

  // Stats
  async getStats() {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json() as Promise<DashboardStats>;
  },
};
```

### Vue.js Example

```javascript
// composables/useApi.js
import { ref } from 'vue';

const API_BASE = 'http://localhost:8000/api';

export function useArticles() {
  const articles = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchArticles(filters = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/articles?${params}`);
      const data = await response.json();
      articles.value = data.items;
      return data;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return { articles, loading, error, fetchArticles };
}
```

---

## Event Types Reference

| Event Type | Description | Turkish |
|------------|-------------|---------|
| `relocation` | Company relocation | Taşınma |
| `closure` | Factory/office closure | Kapanış |
| `expansion` | Business expansion | Genişleme |
| `new_plant` | New facility opening | Yeni Tesis |
| `tender` | Government/corporate tender | İhale |
| `other` | Other news | Diğer |

---

## Score & Color Labels

| Score Range | Action Label | Color Label | Meaning |
|-------------|--------------|-------------|---------|
| 0-30 | Düşük Alaka | gray | Low relevance |
| 31-69 | Orta Fırsat | yellow | Medium opportunity |
| 70-100 | Yüksek Fırsat | green | High opportunity |

---

## Testing Workflow

### 1. Start Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Test with Swagger UI
Open http://localhost:8000/docs and try:
1. Health check
2. Create RSS source
3. Refresh articles
4. List articles
5. Get stats

### 3. Test with curl

```bash
# Health check
curl http://localhost:8000/api/health

# Create source
curl -X POST http://localhost:8000/api/rss-sources \
  -H "Content-Type: application/json" \
  -d '{"name":"TechCrunch","url":"https://techcrunch.com/feed/","category":"technology"}'

# List sources
curl http://localhost:8000/api/rss-sources

# Refresh articles
curl -X POST http://localhost:8000/api/articles/refresh

# List articles
curl "http://localhost:8000/api/articles?limit=10"

# Get stats
curl http://localhost:8000/api/stats
```

---

## Common Issues & Solutions

### CORS Error
Make sure backend is running and CORS origins include your frontend URL.
Default: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`

### 422 Validation Error
Check request body matches the schema. Use Swagger UI to see required fields.

### 400 Invalid RSS URL
The RSS feed URL is not valid or not accessible. Test the URL in a browser first.

### Empty Articles List
Run `POST /api/articles/refresh` first to fetch articles from sources.

---

## Demo RSS Feeds for Testing

```json
[
  {
    "name": "TechCrunch",
    "url": "https://techcrunch.com/feed/",
    "category": "technology"
  },
  {
    "name": "BBC News - Business",
    "url": "http://feeds.bbci.co.uk/news/business/rss.xml",
    "category": "business"
  },
  {
    "name": "The Verge",
    "url": "https://www.theverge.com/rss/index.xml",
    "category": "technology"
  },
  {
    "name": "Ars Technica",
    "url": "https://feeds.arstechnica.com/arstechnica/index",
    "category": "technology"
  }
]
```

---

## Need Help?

1. Check Swagger UI: http://localhost:8000/docs
2. Check backend logs in terminal
3. Verify backend is running: http://localhost:8000/api/health
4. Check CORS configuration in `main.py`

Happy coding! 🚀
