"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Building2, Search, RefreshCw, Trash2, Plus, ArrowRight, MapPin, Newspaper,
  Package, Factory, TrendingUp, Lock, Moon, Sun, Star, Timer, FileText, CircleDot,
  Rss, LayoutGrid, LayoutList, X, CalendarDays, Calendar, Globe, BarChart2,
  AlertTriangle, Download,
} from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { api, convertBackendArticle, type BackendStats } from "@/lib/api"
import { toast } from "sonner"
import { stripHtmlTags } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: number
  title: string
  source: string
  date: string
  event_type: "relocation" | "new_plant" | "expansion" | "closure" | "tender" | "other"
  summary_tr: string
  company: string
  from_location: string | null
  to_location: string | null
  sector: string
  score: number
  image: string
  full_content: string
  link?: string
  confidence?: number
  action_label?: string | null
  color_label?: string | null
}

interface RssSource {
  id: number
  name: string
  url: string
  category?: string | null
  is_active: boolean
  last_fetched_at: string | null
}

type SortKey = "score_desc" | "score_asc" | "date_desc" | "date_asc"

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  relocation: { label: "Taşınma",    icon: Package,   colorClass: "bg-violet-500",  textClass: "text-violet-600 dark:text-violet-400"  },
  new_plant:  { label: "Yeni Tesis", icon: Factory,   colorClass: "bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
  expansion:  { label: "Genişleme",  icon: TrendingUp, colorClass: "bg-blue-500",   textClass: "text-blue-600 dark:text-blue-400"       },
  closure:    { label: "Kapanış",    icon: Lock,      colorClass: "bg-red-500",     textClass: "text-red-600 dark:text-red-400"         },
  tender:     { label: "İhale",      icon: FileText,  colorClass: "bg-orange-500",  textClass: "text-orange-600 dark:text-orange-400"   },
  other:      { label: "Diğer",      icon: CircleDot, colorClass: "bg-slate-400",   textClass: "text-slate-500 dark:text-slate-400"     },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEventConfig(type: NewsItem["event_type"]) {
  return EVENT_CONFIG[type] ?? EVENT_CONFIG.other
}

function getScoreMeta(score: number) {
  if (score >= 80) return { label: "Yüksek Fırsat", ring: "ring-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" }
  if (score >= 65) return { label: "İzlenecek",     ring: "ring-blue-500",    text: "text-blue-600 dark:text-blue-400",       bar: "bg-blue-500"    }
  if (score >= 50) return { label: "Şartlı İlgi",   ring: "ring-amber-500",   text: "text-amber-600 dark:text-amber-400",     bar: "bg-amber-500"   }
  return             { label: "Düşük Alaka",   ring: "ring-slate-300 dark:ring-slate-600", text: "text-slate-500 dark:text-slate-400", bar: "bg-slate-300 dark:bg-slate-600" }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
}

// ─── AnalyticsCards ──────────────────────────────────────────────────────────

function AnalyticsCards({ stats }: { stats: BackendStats }) {
  const cards = [
    {
      icon: CalendarDays,
      label: "Bugün",
      value: stats.today_count,
      sub: "yeni haber",
      accent: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      icon: Calendar,
      label: "Bu Hafta",
      value: stats.week_count,
      sub: "haber",
      accent: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      icon: BarChart2,
      label: "Ort. Skor",
      value: stats.avg_score != null ? stats.avg_score.toFixed(1) : "—",
      sub: `${stats.high_score_count} yüksek skorlu`,
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      icon: Building2,
      label: "Öne Çıkan Şirket",
      value: stats.top_company ?? "—",
      sub: "en çok haber",
      accent: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      truncate: true,
    },
    {
      icon: Globe,
      label: "Öne Çıkan Ülke",
      value: stats.top_country ?? "—",
      sub: "en çok lokasyon",
      accent: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-950/30",
      truncate: true,
    },
    {
      icon: Rss,
      label: "En Aktif Kaynak",
      value: stats.top_source ?? "—",
      sub: "en çok haber",
      accent: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/30",
      truncate: true,
    },
  ]

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
        Genel Bakış
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(({ icon: Icon, label, value, sub, accent, bg, truncate }) => (
          <Card key={label} className={`p-4 ${bg} border-0`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${accent} shrink-0`} />
              <span className="text-xs text-muted-foreground truncate">{label}</span>
            </div>
            <p className={`text-xl font-bold ${accent} leading-tight ${truncate ? "truncate" : ""}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ─── ScoreBadge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const meta = getScoreMeta(score)
  const sizeClass = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-2xl",
  }[size]
  return (
    <div className={`${sizeClass} rounded-full ring-2 ${meta.ring} bg-background flex items-center justify-center shrink-0`}>
      <span className={`font-bold leading-none ${meta.text}`}>{score}</span>
    </div>
  )
}

// ─── FeaturedCard ────────────────────────────────────────────────────────────

function FeaturedCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const event = getEventConfig(item.event_type)
  const score = getScoreMeta(item.score)
  const EventIcon = event.icon

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer group overflow-hidden hover:shadow-lg transition-all duration-200 border-primary/10 hover:border-primary/30"
    >
      <div className={`h-1 w-full ${score.bar}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${event.colorClass} text-white border-0 text-xs gap-1 shrink-0`}>
                <EventIcon className="w-3 h-3" />
                {event.label}
              </Badge>
              {item.sector && item.sector !== "Genel" && (
                <Badge variant="outline" className="text-xs shrink-0">{item.sector}</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatDate(item.date)}</span>
            </div>

            <h3 className="text-lg font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
              {stripHtmlTags(item.summary_tr)}
            </p>

            {(item.from_location || item.to_location) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                {item.from_location && <span>{item.from_location}</span>}
                {item.from_location && item.to_location && <ArrowRight className="w-3.5 h-3.5 text-primary" />}
                {item.to_location && <span className="font-medium text-foreground">{item.to_location}</span>}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
              {item.company !== "Bilinmiyor" && (
                <span className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.company}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 shrink-0">
                <Newspaper className="w-3.5 h-3.5" />
                {item.source}
              </span>
            </div>
          </div>

          <ScoreBadge score={item.score} size="lg" />
        </div>
      </div>
    </Card>
  )
}

// ─── NewsCard ────────────────────────────────────────────────────────────────

function NewsCard({ item, layout, onClick }: { item: NewsItem; layout: "grid" | "list"; onClick: () => void }) {
  const event = getEventConfig(item.event_type)
  const score = getScoreMeta(item.score)
  const EventIcon = event.icon

  if (layout === "list") {
    return (
      <Card
        onClick={onClick}
        className="cursor-pointer group hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <div className="flex items-stretch">
          <div className={`w-1 shrink-0 ${score.bar}`} />
          <div className="flex-1 px-4 py-3 flex items-center gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${event.colorClass} text-white border-0 text-xs gap-1 shrink-0`}>
                  <EventIcon className="w-3 h-3" />
                  {event.label}
                </Badge>
                {item.sector && item.sector !== "Genel" && (
                  <span className="text-xs text-muted-foreground truncate">{item.sector}</span>
                )}
              </div>
              <h3 className="font-medium text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                {item.company !== "Bilinmiyor" && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {item.company}
                  </span>
                )}
                {(item.from_location || item.to_location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.from_location}{item.from_location && item.to_location && " → "}{item.to_location}
                  </span>
                )}
                <span className="ml-auto shrink-0">{formatDate(item.date)}</span>
              </div>
            </div>
            <ScoreBadge score={item.score} size="sm" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer group hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className={`h-1 w-full ${score.bar}`} />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={`${event.colorClass} text-white border-0 text-xs gap-1`}>
            <EventIcon className="w-3 h-3" />
            {event.label}
          </Badge>
          <ScoreBadge score={item.score} size="sm" />
        </div>

        <h3 className="font-semibold text-sm text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {item.title}
        </h3>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {stripHtmlTags(item.summary_tr)}
        </p>

        {(item.from_location || item.to_location) ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3 shrink-0 text-primary" />
            {item.from_location && <span>{item.from_location}</span>}
            {item.from_location && item.to_location && <ArrowRight className="w-3 h-3" />}
            {item.to_location && <span className="font-medium text-foreground">{item.to_location}</span>}
          </div>
        ) : (
          <div className="mb-3" />
        )}

        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.company}</span>
          </span>
          <span className="shrink-0 ml-2">{formatDate(item.date)}</span>
        </div>
      </div>
    </Card>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-1 w-full" />
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="pt-3 border-t border-border flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </Card>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center col-span-full">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Newspaper className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {filtered ? "Sonuç bulunamadı" : "Henüz haber yok"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        {filtered
          ? "Bu filtrelere uyan haber bulunamadı."
          : "RSS kaynaklarınızı ekleyin ve Yenile butonuna basın."}
      </p>
      {filtered && (
        <Button variant="outline" size="sm" onClick={onClear}>
          <X className="w-4 h-4 mr-2" />
          Filtreleri Temizle
        </Button>
      )}
    </div>
  )
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Tema değiştir"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  )
}

// ─── RssPanel (Sheet içeriği) ─────────────────────────────────────────────────

interface RssPanelProps {
  sources: RssSource[]
  maxPerSource: number
  onMaxChange: (v: number) => void
  onAdd: (name: string, url: string) => Promise<void>
  onRemove: (id: number) => Promise<void>
  onFetchSource: (sourceId: number, count: number) => Promise<void>
  isRefreshing: boolean
}

function RssPanel({ sources, maxPerSource, onMaxChange, onAdd, onRemove, onFetchSource, isRefreshing }: RssPanelProps) {
  const [nameInput, setNameInput] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [fetchCounts, setFetchCounts] = useState<Record<number, number>>({})

  const getFetchCount = (id: number) => fetchCounts[id] ?? 5

  const handleAdd = async () => {
    await onAdd(nameInput, urlInput)
    setNameInput("")
    setUrlInput("")
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Add form */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yeni Kaynak Ekle</p>
        <Input
          placeholder="Kaynak adı (opsiyonel)"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          className="h-9"
        />
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/feed"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="flex-1 h-9"
          />
          <Button onClick={handleAdd} size="icon" className="h-9 w-9 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Global fetch settings */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Toplu Çekim Ayarı</p>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Kaynak başına max haber (Yenile butonu)</label>
          <Select value={String(maxPerSource)} onValueChange={v => onMaxChange(Number(v))}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 haber</SelectItem>
              <SelectItem value="5">5 haber (önerilen)</SelectItem>
              <SelectItem value="10">10 haber</SelectItem>
              <SelectItem value="25">25 haber</SelectItem>
              <SelectItem value="50">50 haber</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1.5">
            ≈ {sources.length * maxPerSource} LLM isteği / yenileme
          </p>
        </div>
      </div>

      <Separator />

      {/* Source list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Kaynaklar ({sources.length})
        </p>
        <div className="space-y-2">
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">Kaynak eklenmedi</p>
          ) : (
            sources.map(src => (
              <div
                key={src.id}
                className="flex flex-col gap-2 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${src.is_active ? "bg-emerald-500" : "bg-red-400"}`}
                    title={src.is_active ? "Aktif" : "Pasif"}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{src.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{src.url}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {src.last_fetched_at
                        ? `Son çekim: ${new Date(src.last_fetched_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
                        : "Henüz çekilmedi"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(src.id)}
                    aria-label={`${src.name} kaynağını sil`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {/* Per-source fetch row */}
                <div className="flex items-center gap-2 pl-5">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={getFetchCount(src.id)}
                    onChange={e => setFetchCounts(prev => ({ ...prev, [src.id]: Math.max(1, Math.min(100, Number(e.target.value))) }))}
                    className="w-16 h-7 rounded-md border border-border bg-background px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isRefreshing}
                  />
                  <span className="text-xs text-muted-foreground">haber</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2.5 text-xs gap-1.5 ml-auto"
                    disabled={isRefreshing || !src.is_active}
                    onClick={() => onFetchSource(src.id, getFetchCount(src.id))}
                  >
                    <Download className="w-3 h-3" />
                    Çek
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()

  const [news, setNews] = useState<NewsItem[]>([])
  const [rssSources, setRssSources] = useState<RssSource[]>([])
  const [stats, setStats] = useState<BackendStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventFilter, setEventFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("score_desc")
  const [maxPerSource, setMaxPerSource] = useState(5)
  const [layout, setLayout] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [rssOpen, setRssOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const [totals, setTotals] = useState({ all: 0, high: 0 })

  useEffect(() => {
    setMounted(true)
    loadRSSSources()
    loadNews()
    loadStats()
  }, [])

  const loadRSSSources = useCallback(async () => {
    try {
      const sources = await api.getRSSSources()
      setRssSources(sources)
    } catch {
      toast.error("RSS kaynakları yüklenemedi")
    }
  }, [])

  const loadNews = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.getArticles({ limit: 10000 })
      const items = res.items.map(convertBackendArticle)
      setNews(items)
      setLastRefresh(new Date())
      setTotals({ all: items.length, high: items.filter(i => i.score >= 80).length })
    } catch {
      toast.error("Haberler yüklenemedi")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const s = await api.getStats()
      setStats(s)
    } catch {
      // stats non-critical, silently ignore
    }
  }, [])

  const handleDeleteAll = useCallback(async () => {
    try {
      const res = await api.deleteAllArticles()
      toast.success(res.message)
      setNews([])
      setTotals({ all: 0, high: 0 })
      await loadStats()
    } catch {
      toast.error("Haberler silinemedi")
    }
  }, [loadStats])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await api.refreshArticlesStream(
        maxPerSource,
        (article) => {
          const item = convertBackendArticle(article)
          setNews(prev => {
            const updated = [item, ...prev.filter(n => n.id !== item.id)]
            setTotals({ all: updated.length, high: updated.filter(i => i.score >= 80).length })
            return updated
          })
          loadStats()
        },
        async (summary) => {
          toast.success(
            `${summary.new_articles} yeni haber eklendi, ${summary.duplicates_skipped} tekrar atlandı`
          )
          await loadRSSSources()
          await loadStats()
          setCountdown(60)
        },
        (message) => {
          toast.error(message, { duration: 6000 })
        },
      )
    } catch (e: any) {
      toast.error(e?.message || "Yenileme başarısız", { duration: 6000 })
    } finally {
      setIsRefreshing(false)
    }
  }, [loadRSSSources, loadStats, maxPerSource])

  const handleRefreshSource = useCallback(async (sourceId: number, count: number) => {
    setIsRefreshing(true)
    try {
      await api.refreshArticlesStream(
        count,
        (article) => {
          const item = convertBackendArticle(article)
          setNews(prev => {
            const updated = [item, ...prev.filter(n => n.id !== item.id)]
            setTotals({ all: updated.length, high: updated.filter(i => i.score >= 80).length })
            return updated
          })
          loadStats()
        },
        async (summary) => {
          toast.success(
            `${summary.new_articles} yeni haber eklendi, ${summary.duplicates_skipped} tekrar atlandı`
          )
          await loadRSSSources()
          await loadStats()
        },
        (message) => {
          toast.error(message, { duration: 6000 })
        },
        sourceId,
      )
    } catch (e: any) {
      toast.error(e?.message || "Yenileme başarısız", { duration: 6000 })
    } finally {
      setIsRefreshing(false)
    }
  }, [loadRSSSources, loadStats])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { handleRefresh(); return 60 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, handleRefresh])

  const addSource = async (name: string, url: string) => {
    if (!url.trim()) { toast.error("URL gerekli"); return }
    try {
      const cleanName = name.trim() || (() => {
        try {
          const h = new URL(url).hostname.replace("www.", "").split(".")[0]
          return h.charAt(0).toUpperCase() + h.slice(1) + " RSS"
        } catch { return "Yeni Kaynak" }
      })()
      await api.createRSSSource({ name: cleanName, url })
      toast.success("Kaynak eklendi")
      await loadRSSSources()
    } catch (e: any) {
      toast.error(e.message || "Kaynak eklenemedi")
    }
  }

  const removeSource = async (id: number) => {
    try {
      await api.deleteRSSSource(id)
      toast.success("Kaynak silindi")
      await loadRSSSources()
      await loadNews()
    } catch {
      toast.error("Kaynak silinemedi")
    }
  }

  // ── Filter + sort ─────────────────────────────────────────────────────────

  const filtered = news.filter(item => {
    if (searchTerm) {
      const hay = `${item.title} ${item.summary_tr} ${item.company} ${item.from_location ?? ""} ${item.to_location ?? ""}`.toLowerCase()
      if (!hay.includes(searchTerm.toLowerCase())) return false
    }
    if (eventFilter !== "all" && item.event_type !== eventFilter) return false
    if (sourceFilter !== "all" && item.source !== sourceFilter) return false
    if (scoreFilter === "high"  && item.score < 80)                      return false
    if (scoreFilter === "watch" && (item.score < 65 || item.score >= 80)) return false
    if (scoreFilter === "mid"   && (item.score < 50 || item.score >= 65)) return false
    if (scoreFilter === "low"   && item.score >= 50)                      return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "score_desc") return b.score - a.score
    if (sortKey === "score_asc")  return a.score - b.score
    if (sortKey === "date_desc")  return new Date(b.date).getTime() - new Date(a.date).getTime()
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  const featured = sorted.filter(i => i.score >= 90)
  const regular  = sorted.filter(i => i.score < 90)

  const hasFilters = searchTerm !== "" || eventFilter !== "all" || scoreFilter !== "all" || sourceFilter !== "all"
  const clearFilters = () => { setSearchTerm(""); setEventFilter("all"); setScoreFilter("all"); setSourceFilter("all") }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 mr-1">
            <Building2 className="w-6 h-6 text-primary shrink-0" />
            <span className="font-bold text-foreground text-sm hidden sm:block whitespace-nowrap">
              EU Endüstri Takip
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Şirket, yer, olay ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-muted/50 border-muted focus-visible:border-border focus-visible:bg-background"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="flex-1" />

          {/* Auto-refresh toggle */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Oto</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="scale-90" />
            {autoRefresh && (
              <span className="text-xs font-mono text-primary w-6 text-right">{countdown}s</span>
            )}
          </div>

          {/* RSS button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9"
            onClick={() => setRssOpen(true)}
          >
            <Rss className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">RSS Kaynakları</span>
            {rssSources.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 text-xs px-1.5 py-0 h-4">
                {rssSources.length}
              </Badge>
            )}
          </Button>

          {/* Delete all */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Tüm haberleri sil"
                disabled={news.length === 0}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Tüm haberleri sil
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Veritabanındaki <strong>{news.length} haber</strong> kalıcı olarak silinecek.
                  Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteAll}
                >
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Refresh */}
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2 h-9"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline text-xs">Yenile</span>
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-5 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-sm shrink-0">
            <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Toplam:</span>
            <span className="font-semibold">{totals.all}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm shrink-0">
            <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
            <span className="text-muted-foreground">Yüksek fırsat:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totals.high}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm shrink-0">
            <Rss className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Kaynak:</span>
            <span className="font-semibold">{rssSources.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm shrink-0 ml-auto">
            <span className="text-muted-foreground text-xs">Son güncelleme:</span>
            <span className="font-mono text-xs">
              {mounted && lastRefresh ? lastRefresh.toLocaleTimeString("tr-TR") : "--:--:--"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-background border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
          {/* Event type */}
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="h-8 w-auto min-w-0 text-xs bg-muted/50 border-transparent hover:bg-muted">
              <SelectValue placeholder="Olay Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Olaylar</SelectItem>
              {(Object.entries(EVENT_CONFIG) as [string, typeof EVENT_CONFIG[keyof typeof EVENT_CONFIG]][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Score */}
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="h-8 w-auto min-w-0 text-xs bg-muted/50 border-transparent hover:bg-muted">
              <SelectValue placeholder="Skor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Skorlar</SelectItem>
              <SelectItem value="high">⭐ Yüksek Fırsat (80–100)</SelectItem>
              <SelectItem value="watch">👁 İzlenecek (65–79)</SelectItem>
              <SelectItem value="mid">⚡ Şartlı (50–64)</SelectItem>
              <SelectItem value="low">— Düşük (0–49)</SelectItem>
            </SelectContent>
          </Select>

          {/* Source */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-8 w-auto min-w-0 text-xs bg-muted/50 border-transparent hover:bg-muted">
              <SelectValue placeholder="Kaynak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kaynaklar</SelectItem>
              {rssSources.map(s => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground px-2"
              onClick={clearFilters}
            >
              <X className="w-3 h-3 mr-1" />
              Temizle
            </Button>
          )}

          <div className="flex-1" />

          {/* Sort */}
          <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-8 w-auto min-w-0 text-xs bg-muted/50 border-transparent hover:bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score_desc">Skor: Yüksek → Düşük</SelectItem>
              <SelectItem value="score_asc">Skor: Düşük → Yüksek</SelectItem>
              <SelectItem value="date_desc">Tarih: Yeni → Eski</SelectItem>
              <SelectItem value="date_asc">Tarih: Eski → Yeni</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-border overflow-hidden shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-none border-0 ${layout === "grid" ? "bg-muted" : ""}`}
              onClick={() => setLayout("grid")}
              aria-label="Grid görünüm"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-none border-0 ${layout === "list" ? "bg-muted" : ""}`}
              onClick={() => setLayout("list")}
              aria-label="Liste görünüm"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </Button>
          </div>

          <span className="text-xs text-muted-foreground shrink-0">{sorted.length} haber</span>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {/* Analytics cards */}
        {stats && <AnalyticsCards stats={stats} />}

        {isLoading ? (
          <div className={`grid gap-4 ${layout === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState filtered={hasFilters} onClear={clearFilters} />
        ) : (
          <>
            {/* Featured section */}
            {featured.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Öne Çıkan Fırsatlar
                  </h2>
                  <Badge variant="secondary" className="text-xs px-2 py-0">{featured.length}</Badge>
                </div>
                <div className="space-y-3">
                  {featured.map(item => (
                    <FeaturedCard
                      key={item.id}
                      item={item}
                      onClick={() => router.push(`/news/${item.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Regular news */}
            {regular.length > 0 && (
              <section className="space-y-3">
                {featured.length > 0 && (
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Diğer Haberler
                    <Badge variant="outline" className="ml-2 text-xs px-2 py-0 font-normal">{regular.length}</Badge>
                  </h2>
                )}
                <div className={`grid gap-4 ${layout === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {regular.map(item => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      layout={layout}
                      onClick={() => router.push(`/news/${item.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── RSS Sheet ───────────────────────────────────────────────────────── */}
      <Sheet open={rssOpen} onOpenChange={setRssOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Rss className="w-4 h-4 text-primary" />
              RSS Kaynakları
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <RssPanel
              sources={rssSources}
              maxPerSource={maxPerSource}
              onMaxChange={setMaxPerSource}
              onAdd={addSource}
              onRemove={removeSource}
              onFetchSource={handleRefreshSource}
              isRefreshing={isRefreshing}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
