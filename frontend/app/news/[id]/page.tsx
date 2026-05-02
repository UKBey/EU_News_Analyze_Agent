"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Calendar, 
  MapPin, 
  Newspaper, 
  Package, 
  Factory, 
  TrendingUp, 
  Lock,
  Share2,
  Bookmark,
  ExternalLink
} from "lucide-react"
import { api, convertBackendArticle } from "@/lib/api"
import { toast } from "sonner"
import type { NewsItem } from "@/app/page"

// Helper functions
function getScoreColor(score: number) {
  if (score >= 80) return { border: "border-emerald-500", bg: "bg-emerald-500", text: "text-emerald-600", label: "Yuksek Firsat" }
  if (score >= 65) return { border: "border-blue-500", bg: "bg-blue-500", text: "text-blue-600", label: "Izlenecek" }
  if (score >= 50) return { border: "border-amber-500", bg: "bg-amber-500", text: "text-amber-600", label: "Sartli Ilgi" }
  return { border: "border-slate-400", bg: "bg-slate-400", text: "text-slate-500", label: "Dusuk Alaka" }
}

function getEventTypeConfig(eventType: NewsItem["event_type"]) {
  const config = {
    relocation: { text: "Tasinma", icon: Package, color: "bg-violet-600" },
    new_plant: { text: "Yeni Tesis", icon: Factory, color: "bg-emerald-600" },
    expansion: { text: "Genisleme", icon: TrendingUp, color: "bg-blue-600" },
    closure: { text: "Kapanis", icon: Lock, color: "bg-red-600" }
  }
  return config[eventType] || { text: eventType, icon: Package, color: "bg-slate-600" }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

export default function NewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const newsId = Number(params.id)
  
  const [news, setNews] = useState<NewsItem | null>(null)
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNewsDetail()
  }, [newsId])

  const loadNewsDetail = async () => {
    setIsLoading(true)
    try {
      const article = await api.getArticle(newsId)
      const converted = convertBackendArticle(article)
      setNews(converted)

      // Load related news
      const response = await api.getArticles({ 
        event_type: article.event_type,
        limit: 10 
      })
      const related = response.items
        .filter(item => item.id !== newsId)
        .slice(0, 2)
        .map(convertBackendArticle)
      setRelatedNews(related)
    } catch (error) {
      console.error('Failed to load news:', error)
      toast.error('Haber yuklenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <div className="relative h-72 md:h-96 w-full">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Haber Bulunamadi</h2>
          <p className="text-muted-foreground mb-4">Aradiginiz haber mevcut degil veya kaldirilmis olabilir.</p>
          <Button onClick={() => router.push("/")} className="bg-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Don
          </Button>
        </Card>
      </div>
    )
  }

  const scoreColor = getScoreColor(news.score)
  const eventType = getEventTypeConfig(news.event_type)
  const EventIcon = eventType.icon

  // Handle external link
  const handleExternalLink = () => {
    if (news.link) {
      window.open(news.link, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Geri Don
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-72 md:h-96 w-full">
        <Image
          src={news.image}
          alt={news.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={`${eventType.color} text-white border-0`}>
                <EventIcon className="w-3 h-3 mr-1" />
                {eventType.text}
              </Badge>
              <Badge variant="secondary" className="bg-white/90 text-foreground">{news.sector}</Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight text-balance">
              {news.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {news.company}
              </span>
              <span className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4" />
                {news.source}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(news.date)}
              </span>
            </div>

            {/* Summary */}
            <Card className="p-5 mb-6 bg-primary/5 border-primary/20">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Ozet</h3>
              <p className="text-foreground leading-relaxed">{news.summary_tr}</p>
            </Card>

            {/* Full Content */}
            <div className="prose prose-slate max-w-none">
              {news.full_content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-foreground leading-relaxed mb-4 text-base">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Source Link */}
            <div className="mt-8 pt-6 border-t border-border">
              <Button variant="outline" className="gap-2" onClick={handleExternalLink}>
                <ExternalLink className="w-4 h-4" />
                Orijinal Kaynaga Git
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Card */}
            <Card className={`p-5 border-2 ${scoreColor.border}`}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">BIOS-Fit Skoru</h3>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-20 ${scoreColor.bg} rounded-full`} />
                <div>
                  <div className={`text-5xl font-bold ${scoreColor.text}`}>{news.score}</div>
                  <div className="text-sm text-muted-foreground mt-1">{scoreColor.label}</div>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                {news.score >= 80 
                  ? "Bu haber yuksek is potansiyeli tasiyor ve hemen incelenmesi oneriliyor."
                  : news.score >= 65
                  ? "Bu haber izlenmeye deger ve gelismeler takip edilmeli."
                  : news.score >= 50
                  ? "Sartli olarak ilgi alanina girebilir, ek bilgi bekleniyor."
                  : "Bu haber dusuk oncelikli olarak degerlendirilmektedir."}
              </p>
            </Card>

            {/* Location Card */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Lokasyon Bilgisi</h3>
              {news.from_location && news.to_location ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cikis</p>
                      <p className="font-medium text-foreground">{news.from_location}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Varis</p>
                      <p className="font-medium text-foreground">{news.to_location}</p>
                    </div>
                  </div>
                </div>
              ) : news.to_location ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lokasyon</p>
                    <p className="font-medium text-foreground">{news.to_location}</p>
                  </div>
                </div>
              ) : news.from_location ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lokasyon</p>
                    <p className="font-medium text-foreground">{news.from_location}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Lokasyon bilgisi henuz mevcut degil.</p>
              )}
            </Card>

            {/* Related News */}
            {relatedNews.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ilgili Haberler</h3>
                <div className="space-y-4">
                  {relatedNews.map((item) => {
                    const itemEventType = getEventTypeConfig(item.event_type)
                    return (
                      <div 
                        key={item.id} 
                        className="cursor-pointer group"
                        onClick={() => router.push(`/news/${item.id}`)}
                      >
                        <div className="flex gap-3">
                          <div className="relative w-20 h-16 rounded-md overflow-hidden shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge className={`${itemEventType.color} text-white border-0 text-xs mb-1`}>
                              {itemEventType.text}
                            </Badge>
                            <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                              {item.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
