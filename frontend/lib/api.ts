// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ─── Backend Types (matches FastAPI schemas) ────────────────────────────────

export interface BackendArticle {
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

export interface BackendArticleList {
  total: number
  limit: number
  offset: number
  items: BackendArticle[]
}

export interface BackendRSSSource {
  id: number
  name: string
  url: string
  category: string | null
  is_active: boolean
  last_fetched_at: string | null
  created_at: string
}

export interface BackendRefreshResponse {
  message: string
  sources_checked: number
  new_articles: number
  duplicates_skipped: number
  errors: string[]
}

export interface BackendStats {
  source_count: number
  article_count: number
  high_score_count: number
  event_type_distribution: Record<string, number>
  last_refresh_at: string | null
}

export interface CreateRSSSourcePayload {
  name: string
  url: string
  category?: string
}

export interface GetArticlesParams {
  limit?: number
  offset?: number
  search?: string
  event_type?: string
  min_score?: number
  max_score?: number
}

// ─── Placeholder images by event type ───────────────────────────────────────

const EVENT_TYPE_IMAGES: Record<string, string> = {
  relocation:
    "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&h=400&fit=crop",
  new_plant:
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&h=400&fit=crop",
  expansion:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop",
  closure:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=400&fit=crop",
  tender:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
  other:
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop",
}

// ─── Converter: BackendArticle → frontend NewsItem ───────────────────────────

export function convertBackendArticle(article: BackendArticle) {
  const eventType = article.event_type as
    | "relocation"
    | "new_plant"
    | "expansion"
    | "closure"

  return {
    id: article.id,
    title: article.title,
    source: article.source_name,
    date: article.published_at
      ? article.published_at.split("T")[0]
      : article.created_at.split("T")[0],
    event_type: eventType,
    summary_tr: article.summary_tr || article.raw_summary || "Özet mevcut değil.",
    company: article.company || "Bilinmiyor",
    from_location: article.from_location,
    to_location: article.to_location,
    sector: article.sector || "Genel",
    score: article.score,
    // Placeholder image based on event type (backend doesn't store images)
    image: EVENT_TYPE_IMAGES[article.event_type] || EVENT_TYPE_IMAGES.other,
    // Use raw_summary as full content since backend stores only summary
    full_content: article.raw_summary || article.summary_tr || "İçerik mevcut değil.",
    // Extra fields for detail page
    link: article.link,
    confidence: article.confidence,
    action_label: article.action_label,
    color_label: article.color_label,
  }
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body.detail || body.message || message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// ─── API client ──────────────────────────────────────────────────────────────

export const api = {
  // RSS Sources
  getRSSSources(): Promise<BackendRSSSource[]> {
    return request<BackendRSSSource[]>("/api/rss-sources")
  },

  createRSSSource(payload: CreateRSSSourcePayload): Promise<BackendRSSSource> {
    return request<BackendRSSSource>("/api/rss-sources", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  deleteRSSSource(id: number): Promise<void> {
    return request<void>(`/api/rss-sources/${id}`, { method: "DELETE" })
  },

  // Articles
  getArticles(params: GetArticlesParams = {}): Promise<BackendArticleList> {
    const qs = new URLSearchParams()
    if (params.limit !== undefined) qs.set("limit", String(params.limit))
    if (params.offset !== undefined) qs.set("offset", String(params.offset))
    if (params.search) qs.set("search", params.search)
    if (params.event_type && params.event_type !== "all")
      qs.set("event_type", params.event_type)
    if (params.min_score !== undefined)
      qs.set("min_score", String(params.min_score))
    if (params.max_score !== undefined)
      qs.set("max_score", String(params.max_score))
    const query = qs.toString()
    return request<BackendArticleList>(`/api/articles${query ? `?${query}` : ""}`)
  },

  getArticle(id: number): Promise<BackendArticle> {
    return request<BackendArticle>(`/api/articles/${id}`)
  },

  refreshArticles(maxPerSource: number = 5): Promise<BackendRefreshResponse> {
    return request<BackendRefreshResponse>(`/api/articles/refresh?max_per_source=${maxPerSource}`, {
      method: "POST",
    })
  },

  // Stats
  getStats(): Promise<BackendStats> {
    return request<BackendStats>("/api/stats")
  },
}
