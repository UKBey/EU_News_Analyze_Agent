"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, ArrowRight, Building2, Calendar, MapPin, Newspaper,
  Package, Factory, TrendingUp, Lock, ExternalLink, FileText, CircleDot,
  Star, ChevronRight, StickyNote, Pencil, Trash2, Check, X, Info, Save,
} from "lucide-react"
import { api, convertBackendArticle, type BackendArticle, type BackendScoreBreakdown, type BackendNote } from "@/lib/api"
import { toast } from "sonner"
import { stripHtmlTags } from "@/lib/utils"
import type { NewsItem } from "@/app/page"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  relocation: { label: "Taşınma",    icon: Package,    colorClass: "bg-violet-500"  },
  new_plant:  { label: "Yeni Tesis", icon: Factory,    colorClass: "bg-emerald-500" },
  expansion:  { label: "Genişleme",  icon: TrendingUp, colorClass: "bg-blue-500"    },
  closure:    { label: "Kapanış",    icon: Lock,       colorClass: "bg-red-500"     },
  tender:     { label: "İhale",      icon: FileText,   colorClass: "bg-orange-500"  },
  other:      { label: "Diğer",      icon: CircleDot,  colorClass: "bg-slate-400"   },
} as const

function getEventConfig(type: string) {
  return EVENT_CONFIG[type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.other
}

function getScoreMeta(score: number) {
  if (score >= 80) return {
    label: "Yüksek Fırsat",
    desc: "Bu haber yüksek iş potansiyeli taşıyor. Hemen incelenmesi önerilir.",
    ring: "ring-emerald-500", text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30",
  }
  if (score >= 65) return {
    label: "İzlenecek",
    desc: "Bu haber izlemeye değer. Gelişmeler yakından takip edilmeli.",
    ring: "ring-blue-500", text: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30",
  }
  if (score >= 50) return {
    label: "Şartlı İlgi",
    desc: "Şartlı olarak ilgi alanına girebilir. Ek bilgi bekleniyor.",
    ring: "ring-amber-500", text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30",
  }
  return {
    label: "Düşük Alaka",
    desc: "Bu haber düşük öncelikli olarak değerlendirilmektedir.",
    ring: "ring-slate-300 dark:ring-slate-600", text: "text-slate-500 dark:text-slate-400",
    bar: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-900/50",
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("tr-TR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

// Persist a random user ID in localStorage so notes are user-scoped
function getUserId(): string {
  if (typeof window === "undefined") return "anonymous"
  let id = localStorage.getItem("bsmt_user_id")
  if (!id) {
    id = Math.random().toString(36).substring(2, 11)
    localStorage.setItem("bsmt_user_id", id)
  }
  return id
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Skeleton className="h-9 w-28" />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-9 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({ score, confidence }: { score: number; confidence?: number }) {
  const meta = getScoreMeta(score)
  return (
    <Card className="overflow-hidden">
      <div className={`h-1 w-full ${meta.bar}`} />
      <div className={`p-5 ${meta.bg}`}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          BIOS-Fit Skoru
        </p>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-20 h-20 rounded-full ring-4 ${meta.ring} bg-background flex items-center justify-center shrink-0`}>
            <span className={`text-3xl font-bold ${meta.text}`}>{score}</span>
          </div>
          <div>
            <p className={`text-lg font-semibold ${meta.text}`}>{meta.label}</p>
            {confidence !== undefined && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Güven: %{Math.round(confidence * 100)}
              </p>
            )}
          </div>
        </div>
        <Separator className="mb-4" />
        <p className="text-sm text-muted-foreground leading-relaxed">{meta.desc}</p>
      </div>
    </Card>
  )
}

// ─── Score Breakdown Card ─────────────────────────────────────────────────────

const BREAKDOWN_META: Record<string, { short: string; full: string; color: string }> = {
  E: { short: "E", full: "Olay Tipi",     color: "bg-violet-500" },
  A: { short: "A", full: "Aktör Netliği", color: "bg-blue-500"   },
  G: { short: "G", full: "Coğrafya",      color: "bg-emerald-500"},
  T: { short: "T", full: "Zaman",         color: "bg-amber-500"  },
  C: { short: "C", full: "Kaynak Güveni", color: "bg-orange-500" },
}

const EVENT_TYPE_OPTIONS = [
  { value: "relocation", label: "Taşınma" },
  { value: "new_plant",  label: "Yeni Tesis" },
  { value: "expansion",  label: "Genişleme" },
  { value: "closure",    label: "Kapanış" },
  { value: "tender",     label: "İhale" },
  { value: "other",      label: "Diğer" },
]

const TIMELINE_OPTIONS = [
  { value: "0-6m",   label: "0-6 ay (Kısa vadeli)" },
  { value: "6-18m",  label: "6-18 ay (Orta vadeli)" },
  { value: "18-36m", label: "18-36 ay (Uzun vadeli)" },
  { value: "__none__", label: "Belirtilmemiş" },
]

interface ScoreBreakdownCardProps {
  breakdown: BackendScoreBreakdown
  score: number
  article: BackendArticle
  onUpdate: (updated: BackendArticle) => void
}

function ScoreBreakdownCard({ breakdown, score, article, onUpdate }: ScoreBreakdownCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    event_type: article.event_type ?? "other",
    company: article.company ?? "",
    from_location: article.from_location ?? "",
    to_location: article.to_location ?? "",
    sector: article.sector ?? "",
    timeline: article.timeline ?? "__none__",
  })

  const startEdit = () => {
    setForm({
      event_type: article.event_type ?? "other",
      company: article.company ?? "",
      from_location: article.from_location ?? "",
      to_location: article.to_location ?? "",
      sector: article.sector ?? "",
      timeline: article.timeline ?? "__none__",
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await api.updateArticle(article.id, {
        event_type: form.event_type,
        company: form.company.trim() || null,
        from_location: form.from_location.trim() || null,
        to_location: form.to_location.trim() || null,
        sector: form.sector.trim() || null,
        timeline: form.timeline === "__none__" ? null : form.timeline,
      })
      onUpdate(updated)
      setIsEditing(false)
    } catch {
      toast.error("Kaydedilemedi")
    } finally {
      setIsSaving(false)
    }
  }

  // ── value hints per dimension ───────────────────────────────────────────
  const eventLabel = EVENT_TYPE_OPTIONS.find(o => o.value === article.event_type)?.label ?? "Diğer"

  const actorChips = [
    { label: "Şirket",  present: !!article.company },
    { label: "Çıkış",   present: !!article.from_location },
    { label: "Varış",   present: !!article.to_location },
    { label: "Sektör",  present: !!article.sector },
  ]

  const locStr = (article.from_location ?? "") + (article.to_location ?? "")
  const isEU = ["almanya","fransa","ingiltere","türkiye","macaristan","avrupa","germany","france",
    "uk","turkey","hungary","scotland","edinburgh","poland","polonya","czech","çek","romania",
    "romanya","italy","italya","spain","ispanya","portugal","portekiz","netherlands","hollanda",
    "belgium","belçika","austria","avusturya","sweden","isveç","denmark","danimarka","finland",
    "finlandiya","norway","norveç","ireland","irlanda","greece","yunanistan","bulgaria","bulgaristan",
  ].some(k => locStr.toLowerCase().includes(k))

  const timelineLabel = TIMELINE_OPTIONS.find(o => o.value === (article.timeline ?? ""))?.label
    ?? "Belirtilmemiş"

  const sourceTrustLabel =
    breakdown.source_trust_score >= 0.8 ? "Yüksek Güven"
    : breakdown.source_trust_score >= 0.65 ? "İyi Güven"
    : "Standart"

  const rows: Array<{ key: string; contrib: number; max: number; hint: React.ReactNode }> = [
    {
      key: "E", contrib: breakdown.contribution_E, max: breakdown.max_E,
      hint: <span className="text-xs text-muted-foreground italic">{eventLabel}</span>,
    },
    {
      key: "A", contrib: breakdown.contribution_A, max: breakdown.max_A,
      hint: (
        <span className="flex flex-wrap gap-1">
          {actorChips.map(c => (
            <span
              key={c.label}
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                c.present
                  ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                  : "bg-muted text-muted-foreground line-through"
              }`}
            >
              {c.label}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: "G", contrib: breakdown.contribution_G, max: breakdown.max_G,
      hint: (
        <span className={`text-xs italic ${isEU ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
          {isEU ? "AB Bölgesi" : "AB Dışı"}
        </span>
      ),
    },
    {
      key: "T", contrib: breakdown.contribution_T, max: breakdown.max_T,
      hint: <span className="text-xs text-muted-foreground italic">{timelineLabel}</span>,
    },
    {
      key: "C", contrib: breakdown.contribution_C, max: breakdown.max_C,
      hint: <span className="text-xs text-muted-foreground italic">{sourceTrustLabel}</span>,
    },
  ]

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          Skor Dökümü
        </p>
        <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
          <Info className="w-3 h-3" />
          0.30E + 0.25A + 0.20G + 0.15T + 0.10C
        </span>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={startEdit}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Breakdown rows */}
      <div className="space-y-3">
        {rows.map(({ key, contrib, max, hint }) => {
          const lbl = BREAKDOWN_META[key]
          const pct = max > 0 ? (contrib / max) * 100 : 0
          return (
            <div key={key}>
              <div className="flex items-start justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <span className={`w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${lbl.color}`}>
                    {lbl.short}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-foreground font-medium leading-none">{lbl.full}</span>
                    <div className="leading-tight">{hint}</div>
                  </div>
                </div>
                <span className="font-mono text-muted-foreground shrink-0">
                  <span className="text-foreground font-semibold">{contrib}</span>/{max}pt
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${lbl.color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <Separator className="my-4" />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Toplam</span>
        <span className="font-bold text-foreground">{score} / 100 puan</span>
      </div>

      {/* ── Edit form ─────────────────────────────────────────────────────── */}
      {isEditing && (
        <>
          <Separator className="mb-4" />
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Alanları Düzenle
            </p>

            {/* E — event_type */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">E</span>
                Olay Tipi
              </label>
              <Select
                value={form.event_type}
                onValueChange={v => setForm(f => ({ ...f, event_type: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* A — actor fields */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">A</span>
                Aktör Alanları
              </label>
              <Input
                placeholder="Şirket adı"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Çıkış lokasyonu (ör. Berlin, Germany)"
                value={form.from_location}
                onChange={e => setForm(f => ({ ...f, from_location: e.target.value }))}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Varış lokasyonu (ör. Warsaw, Poland)"
                value={form.to_location}
                onChange={e => setForm(f => ({ ...f, to_location: e.target.value }))}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Sektör (ör. Otomotiv)"
                value={form.sector}
                onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            {/* G note */}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">G</span>
              Coğrafya skoru lokasyon alanlarından otomatik hesaplanır
            </p>

            {/* T — timeline */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">T</span>
                Zaman Penceresi
              </label>
              <Select
                value={form.timeline}
                onValueChange={v => setForm(f => ({ ...f, timeline: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map(o => (
                    <SelectItem key={o.value || "__none__"} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* C note */}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">C</span>
              Kaynak güveni RSS kaynağından otomatik belirlenir
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                İptal
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

// ─── Location Card ────────────────────────────────────────────────────────────

function LocationCard({ from, to }: { from: string | null; to: string | null }) {
  if (!from && !to) return null
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Lokasyon</p>
      <div className="space-y-3">
        {from && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Çıkış</p>
              <p className="font-medium text-sm">{from}</p>
            </div>
          </div>
        )}
        {from && to && (
          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        )}
        {to && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{from ? "Varış" : "Lokasyon"}</p>
              <p className="font-medium text-sm">{to}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Related Card ─────────────────────────────────────────────────────────────

function RelatedCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const event = getEventConfig(item.event_type)
  const EventIcon = event.icon
  return (
    <button
      onClick={onClick}
      className="w-full text-left group flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
    >
      <Badge className={`${event.colorClass} text-white border-0 text-xs shrink-0 mt-0.5`}>
        <EventIcon className="w-3 h-3" />
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{item.source}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
    </button>
  )
}

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ articleId }: { articleId: number }) {
  const [notes, setNotes] = useState<BackendNote[]>([])
  const [newNoteText, setNewNoteText] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const userId = useRef(getUserId())

  useEffect(() => {
    api.getNotes(articleId, userId.current)
      .then(setNotes)
      .catch(() => { /* silently ignore */ })
  }, [articleId])

  const handleSave = async () => {
    if (!newNoteText.trim()) return
    setIsSaving(true)
    try {
      const note = await api.createNote(articleId, newNoteText.trim(), userId.current)
      setNotes(prev => [note, ...prev])
      setNewNoteText("")
    } catch {
      toast.error("Not kaydedilemedi")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editText.trim()) return
    try {
      const updated = await api.updateNote(id, editText.trim())
      setNotes(prev => prev.map(n => n.id === id ? updated : n))
      setEditingId(null)
    } catch {
      toast.error("Not güncellenemedi")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch {
      toast.error("Not silinemedi")
    }
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <StickyNote className="w-3.5 h-3.5" />
        Notlarım
        {notes.length > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 font-normal">
            {notes.length}
          </Badge>
        )}
      </p>

      {/* Add note */}
      <div className="space-y-2 mb-5">
        <Textarea
          placeholder="Bu haber hakkında not veya iş fırsatı yorumunu buraya ekle..."
          value={newNoteText}
          onChange={e => setNewNoteText(e.target.value)}
          rows={3}
          className="text-sm resize-none"
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave()
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ctrl+Enter ile kaydet</span>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !newNoteText.trim()}
            className="h-8 text-xs gap-1.5"
          >
            <StickyNote className="w-3.5 h-3.5" />
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      {/* Existing notes */}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          Henüz not eklenmedi.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="rounded-lg border border-border bg-muted/30 p-3 group"
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleUpdate(note.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(note.updated_at !== note.created_at ? note.updated_at : note.created_at)}
                      {note.updated_at !== note.created_at && " (düzenlendi)"}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditingId(note.id); setEditText(note.content) }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const newsId = Number(params.id)

  const [news, setNews] = useState<NewsItem | null>(null)
  const [rawArticle, setRawArticle] = useState<BackendArticle | null>(null)
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([])
  const [breakdown, setBreakdown] = useState<BackendScoreBreakdown | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadDetail()
  }, [newsId])

  const loadDetail = async () => {
    setIsLoading(true)
    try {
      const [article, bd] = await Promise.all([
        api.getArticle(newsId),
        api.getScoreBreakdown(newsId).catch(() => null),
      ])
      setRawArticle(article)
      setNews(convertBackendArticle(article))
      setBreakdown(bd)

      const res = await api.getArticles({ event_type: article.event_type, limit: 10 })
      setRelatedNews(
        res.items.filter(i => i.id !== newsId).slice(0, 3).map(convertBackendArticle)
      )
    } catch {
      toast.error("Haber yüklenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleArticleUpdate = async (updated: BackendArticle) => {
    setRawArticle(updated)
    setNews(convertBackendArticle(updated))
    const bd = await api.getScoreBreakdown(newsId).catch(() => null)
    setBreakdown(bd)
    toast.success("Haber güncellendi, skor yeniden hesaplandı")
  }

  const handleArticleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.deleteArticle(newsId)
      toast.success("Haber silindi")
      router.push("/")
    } catch {
      toast.error("Haber silinemedi")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return <DetailSkeleton />

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Haber bulunamadı</h2>
          <p className="text-sm text-muted-foreground mb-4">Bu haber mevcut değil ya da kaldırılmış.</p>
          <Button onClick={() => router.push("/")} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Card>
      </div>
    )
  }

  const event = getEventConfig(news.event_type)
  const score = getScoreMeta(news.score)
  const EventIcon = event.icon
  const paragraphs = stripHtmlTags(news.full_content)
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sil</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Haberi sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu haber ve bağlı notlar kalıcı olarak silinecek. Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleArticleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Siliniyor..." : "Evet, sil"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {news.link && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(news.link, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Kaynağa Git</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Page hero */}
      <div className="border-b border-border">
        <div className={`h-1.5 w-full ${score.bar}`} />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className={`${event.colorClass} text-white border-0 gap-1.5`}>
              <EventIcon className="w-3.5 h-3.5" />
              {event.label}
            </Badge>
            {news.sector && news.sector !== "Genel" && (
              <Badge variant="outline">{news.sector}</Badge>
            )}
            {news.score >= 90 && (
              <Badge className="bg-amber-500 text-white border-0 gap-1">
                <Star className="w-3 h-3 fill-white" />
                Öne Çıkan
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug text-balance">
            {news.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
            {news.company !== "Bilinmiyor" && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {news.company}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Newspaper className="w-4 h-4" />
              {news.source}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(news.date)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary box */}
            <Card className="p-5 bg-primary/5 border-primary/20">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Özet</p>
              <p className="text-foreground leading-relaxed text-sm">
                {stripHtmlTags(news.summary_tr)}
              </p>
            </Card>

            {/* Full content */}
            <div className="space-y-4">
              {paragraphs.map((para, i) => (
                <p key={i} className="text-foreground leading-relaxed text-sm">
                  {para}
                </p>
              ))}
            </div>

            {/* Notes */}
            <NotesSection articleId={newsId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ScoreCard score={news.score} confidence={news.confidence} />
            {breakdown && rawArticle && (
              <ScoreBreakdownCard
                breakdown={breakdown}
                score={news.score}
                article={rawArticle}
                onUpdate={handleArticleUpdate}
              />
            )}
            <LocationCard from={news.from_location} to={news.to_location} />

            {relatedNews.length > 0 && (
              <Card className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Benzer Haberler
                </p>
                <div className="space-y-1 -mx-3">
                  {relatedNews.map(item => (
                    <RelatedCard
                      key={item.id}
                      item={item}
                      onClick={() => router.push(`/news/${item.id}`)}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
