"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { 
  Building2, 
  Search, 
  RefreshCw, 
  Trash2, 
  Plus, 
  ArrowRight, 
  MapPin, 
  Newspaper,
  Package,
  Factory,
  TrendingUp,
  Lock,
  Moon,
  Sun,
  Star,
  Timer
} from "lucide-react"
import { api, convertBackendArticle, type BackendRSSSource } from "@/lib/api"
import { toast } from "sonner"
import { stripHtmlTags } from "@/lib/utils"

// Types
export interface NewsItem {
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
}

interface RssSource {
  id: number
  name: string
  url: string
  category?: string | null
}

// Mock data
export const mockNewsData: NewsItem[] = [
  {
    id: 1,
    title: "BMW, Munih'teki uretim hattini Macaristan'a tasiyor",
    source: "Reuters",
    date: "2026-05-01",
    event_type: "relocation",
    summary_tr: "BMW, maliyetleri optimize etmek amaciyla Munih'teki bazi motor uretim hatlarini 2026 ilk ceyreginde Debrecen, Macaristan'a tasiyacagini duyurdu.",
    company: "BMW",
    from_location: "Munih, Almanya",
    to_location: "Debrecen, Macaristan",
    sector: "Otomotiv",
    score: 99,
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&h=400&fit=crop",
    full_content: "BMW Group, Almanya'nin Munih kentindeki motor uretim tesislerinin bir kismini Macaristan'in Debrecen sehrine tasima karari aldi. Sirket yetkilileri, bu hamlenin maliyetleri optimize etme ve Dogu Avrupa pazarina daha yakin olma stratejisinin bir parcasi oldugunu belirtti.\n\nTasima isleminin 2026'nin ilk ceyreginde tamamlanmasi planlaniyor. Debrecen'deki yeni tesis, yillik 500.000 motor uretim kapasitesine sahip olacak. Bu gelisme, BMW'nin elektrikli arac donusumu cercevesinde geleneksel icten yanmali motor uretimini yeniden yapilandirma cabasinin bir parcasi.\n\nMacaristan hukumeti, yatirimi desteklemek icin onemli vergi tesvik paketleri sundu. Tasinan uretim hatti, yaklasik 1.200 kisilik istihdam yaratacak."
  },
  {
    id: 2,
    title: "Bosch yeni bir tesis acilisi planliyor",
    source: "Bloomberg",
    date: "2026-04-28",
    event_type: "new_plant",
    summary_tr: "Bosch, elektrikli arac bataryalari icin yeni bir tesis kurmayi planliyor ancak lokasyon henuz netlesmedi.",
    company: "Bosch",
    from_location: null,
    to_location: null,
    sector: "Otomotiv",
    score: 55,
    image: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&h=400&fit=crop",
    full_content: "Bosch, elektrikli arac sektorundeki buyumesini desteklemek amaciyla yeni bir batarya uretim tesisi kurmak icin planlama asamasinda oldugunu duyurdu. Sirket, lokasyon secimi icin birkac Avrupa ulkesini degerlendiriyor.\n\nPotansiyel lokasyonlar arasinda Polonya, Cekkya ve Romanya yer aliyor. Yatirim tutarinin 2 milyar Euro'yu asacagi tahmin ediliyor. Tesisin 2028'de tam kapasite ile faaliyete gecmesi hedefleniyor.\n\nBosch CEO'su, 'Elektrikli mobilite donusumunde kritik bir rol ustleniyoruz. Bu tesis, Avrupa'daki batarya tedarik zincirini guclendirmek icin stratejik oneme sahip' dedi."
  },
  {
    id: 3,
    title: "Siemens, Polonya'da uretim kapasitesini artiriyor",
    source: "Financial Times",
    date: "2026-04-25",
    event_type: "expansion",
    summary_tr: "Siemens, Polonya Wroclaw'daki tesisinde otomasyon ekipmanlari uretim kapasitesini %40 artiracagini acikladi.",
    company: "Siemens",
    from_location: null,
    to_location: "Wroclaw, Polonya",
    sector: "Endustriyel Otomasyon",
    score: 72,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop",
    full_content: "Siemens AG, Polonya'nin Wroclaw sehrindeki endustriyel otomasyon tesisinde onemli bir kapasite artisina gidecegini duyurdu. 800 milyon Euro'luk yatirimla uretim kapasitesi %40 oraninda artacak.\n\nGenisleme projesi kapsaminda yeni uretim hatlari, arastirma-gelistirme merkezi ve lojistik alani insa edilecek. Proje tamamlandiginda 2.000 yeni is imkani olusacak.\n\nSiemens Yonetim Kurulu Uyesi, 'Polonya, Avrupa'daki en onemli uretim merkezlerimizden biri. Bu yatirim, bolgedeki musterlermize daha hizli ve verimli hizmet sunmamizi saglayacak' aciklamasini yapti."
  },
  {
    id: 4,
    title: "Volkswagen Italya fabrikasini kapatiyor",
    source: "Der Spiegel",
    date: "2026-04-20",
    event_type: "closure",
    summary_tr: "Volkswagen, Kuzey Italya'daki parca uretim tesisini 2027 sonuna kadar kapatma karari aldi. 850 calisan etkilenecek.",
    company: "Volkswagen",
    from_location: "Torino, Italya",
    to_location: null,
    sector: "Otomotiv",
    score: 35,
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=400&fit=crop",
    full_content: "Volkswagen Group, Kuzey Italya'nin Torino kentindeki parca uretim tesisini 2027 sonuna kadar kapatacagini duyurdu. 1978'den beri faaliyet gosteren tesis, yaklasik 850 calisana istihdam sagliyor.\n\nSirket, kapanis kararinin elektrikli arac donusumu ve maliyet optimizasyonu stratejisinin bir parcasi oldugunu belirtti. Etkilenen calisanlara kidem tazminati, erken emeklilik paketleri ve grup ici transfer firsatlari sunulacak.\n\nItalyan sendikalari karara sert tepki gosterdi. Hukumet ise Volkswagen ile istihdam garantileri konusunda muzakere yapilmasi cagrisi yapti. Tesisin uretim fonksiyonlarinin bir kismi Slovakya ve Turkiye'deki fabrikalara transfer edilecek."
  },
  {
    id: 5,
    title: "Mercedes-Benz Romanya'da yeni fabrika kuruyor",
    source: "Reuters",
    date: "2026-04-18",
    event_type: "new_plant",
    summary_tr: "Mercedes-Benz, elektrikli arac uretimi icin Romanya Brasov'da yeni bir tesis kuracagini acikladi. 3 milyar Euro yatirim planlaniyor.",
    company: "Mercedes-Benz",
    from_location: null,
    to_location: "Brasov, Romanya",
    sector: "Otomotiv",
    score: 92,
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=400&fit=crop",
    full_content: "Mercedes-Benz, Romanya'nin Brasov sehrinde elektrikli arac uretimi icin yeni bir fabrika kuracagini duyurdu. 3 milyar Euro'luk yatirimla kurulacak tesis, yillik 200.000 arac uretim kapasitesine sahip olacak."
  },
  {
    id: 6,
    title: "BMW Cekya'daki tesisi genisletiyor",
    source: "Handelsblatt",
    date: "2026-04-15",
    event_type: "expansion",
    summary_tr: "BMW, Cekya'daki mevcut tesisinde elektrikli arac batarya uretim hatti eklemeyi planliyor.",
    company: "BMW",
    from_location: null,
    to_location: "Prag, Cekkya",
    sector: "Otomotiv",
    score: 78,
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=400&fit=crop",
    full_content: "BMW, Cekya'nin baskenti Prag yakinlarindaki mevcut tesisine elektrikli arac batarya uretim hatti eklemeyi planliyor. 500 milyon Euro'luk yatirim ile kapasite iki katina cikarilacak."
  }
]

const initialRssSources: RssSource[] = []

// Helper functions
function getScoreColor(score: number) {
  if (score >= 80) return { border: "border-l-emerald-500", bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Yüksek Fırsat" }
  if (score >= 65) return { border: "border-l-blue-500", bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", label: "İzlenecek" }
  if (score >= 50) return { border: "border-l-amber-500", bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Şartlı İlgi" }
  return { border: "border-l-slate-400", bg: "bg-slate-400", text: "text-slate-500 dark:text-slate-400", label: "Düşük Alaka" }
}

function getEventTypeConfig(eventType: NewsItem["event_type"]) {
  const config = {
    relocation: { text: "Taşınma", icon: Package, color: "bg-violet-600" },
    new_plant: { text: "Yeni Tesis", icon: Factory, color: "bg-emerald-600" },
    expansion: { text: "Genişleme", icon: TrendingUp, color: "bg-blue-600" },
    closure: { text: "Kapanış", icon: Lock, color: "bg-red-600" }
  }
  return config[eventType] || { text: eventType, icon: Package, color: "bg-slate-600" }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

// Featured News Component (for high score news)
function FeaturedNewsCard({ news, onClick }: { news: NewsItem; onClick: () => void }) {
  const scoreColor = getScoreColor(news.score)
  const eventType = getEventTypeConfig(news.event_type)
  const EventIcon = eventType.icon

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent group"
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative h-56 md:h-auto md:w-80 overflow-hidden shrink-0">
          <Image
            src={news.image}
            alt={news.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground border-0 shadow-md gap-1">
              <Star className="w-3 h-3 fill-current" />
              One Cikan
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${eventType.color} text-white border-0`}>
              <EventIcon className="w-3 h-3 mr-1" />
              {eventType.text}
            </Badge>
            <Badge variant="secondary">{news.sector}</Badge>
            <span className="text-sm text-muted-foreground">{formatDate(news.date)}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
            {news.title}
          </h3>

          {/* Summary */}
          <p className="text-muted-foreground mb-4 leading-relaxed">{stripHtmlTags(news.summary_tr)}</p>

          {/* Location */}
          {(news.from_location || news.to_location) && (
            <div className="flex items-center gap-2 text-sm mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              {news.from_location && <span className="text-muted-foreground">{news.from_location}</span>}
              {news.from_location && news.to_location && <ArrowRight className="w-4 h-4 text-primary" />}
              {news.to_location && <span className="text-foreground font-medium">{news.to_location}</span>}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {news.company}
              </span>
              <span className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4" />
                {news.source}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-6 ${scoreColor.bg} rounded-full`} />
                <span className={`text-lg font-bold ${scoreColor.text}`}>{news.score}</span>
              </div>
              <span className="text-sm text-primary font-medium group-hover:underline">Devamini Oku</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Components
function NewsCard({ news, onClick }: { news: NewsItem; onClick: () => void }) {
  const scoreColor = getScoreColor(news.score)
  const eventType = getEventTypeConfig(news.event_type)
  const EventIcon = eventType.icon

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${scoreColor.border} border-l-4 bg-card group`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={news.image}
          alt={news.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${eventType.color} text-white border-0 shadow-md`}>
            <EventIcon className="w-3 h-3 mr-1" />
            {eventType.text}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-md">
          <div className={`w-2 h-6 ${scoreColor.bg} rounded-full`} />
          <div className="text-right">
            <div className={`text-lg font-bold ${scoreColor.text}`}>{news.score}</div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">{news.sector}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(news.date)}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
          {news.title}
        </h3>

        {/* Summary */}
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">{stripHtmlTags(news.summary_tr)}</p>

        {/* Location */}
        <div className="mb-4">
          {news.from_location && news.to_location ? (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{news.from_location}</span>
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">{news.to_location}</span>
            </div>
          ) : news.to_location ? (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{news.to_location}</span>
            </div>
          ) : news.from_location ? (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{news.from_location}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">Lokasyon belirtilmedi</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {news.company}
            </span>
            <span className="flex items-center gap-1.5">
              <Newspaper className="w-4 h-4" />
              {news.source}
            </span>
          </div>
          <span className="text-sm text-primary font-medium group-hover:underline">Devamini Oku</span>
        </div>
      </div>
    </Card>
  )
}

// Theme Toggle Component
function ThemeToggle() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden bg-card">
          <Skeleton className="h-48 w-full" />
          <div className="p-5">
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="flex justify-between pt-3 border-t border-border">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Newspaper className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {hasFilters ? "Sonuc bulunamadi" : "Henuz haber yok"}
      </h3>
      <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
        {hasFilters
          ? "Arama kriterlerinize uygun haber bulunamadi. Filtreleri degistirmeyi veya tum haberleri gostermeyi deneyin."
          : "RSS kaynaklarinizi ekleyin ve haberleri cekmeye baslayin."}
      </p>
      {hasFilters && onClearFilters && (
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={onClearFilters}>
            <RefreshCw className="w-4 h-4" />
            Filtreleri Temizle
          </Button>
        </div>
      )}
    </div>
  )
}

// Theme Toggle Component
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
      aria-label="Tema degistir"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>([])
  const [rssSources, setRssSources] = useState<RssSource[]>(initialRssSources)
  const [rssInput, setRssInput] = useState("")
  const [rssNameInput, setRssNameInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [scoreFilter, setScoreFilter] = useState<string>("all")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [mounted, setMounted] = useState(false)

  // Set mounted and initial lastRefresh on client only
  useEffect(() => {
    setMounted(true)
    loadRSSSources()
    loadNews()
  }, [])

  // Load RSS sources from backend
  const loadRSSSources = useCallback(async () => {
    try {
      const sources = await api.getRSSSources()
      setRssSources(sources)
    } catch (error) {
      console.error('Failed to load RSS sources:', error)
      toast.error('RSS kaynaklari yuklenemedi')
    }
  }, [])

  // Load news from backend
  const loadNews = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.getArticles({ limit: 100 })
      const convertedNews = response.items.map(convertBackendArticle)
      setNews(convertedNews)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to load news:', error)
      toast.error('Haberler yuklenemedi')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    try {
      const refreshResult = await api.refreshArticles()
      toast.success(`${refreshResult.new_articles} yeni haber eklendi, ${refreshResult.duplicates_skipped} tekrar atlandı`)
      
      // Reload news after refresh
      await loadNews()
      setCountdown(60)
    } catch (error) {
      console.error('Failed to refresh news:', error)
      toast.error('Haberler yenilenemedi')
      setIsLoading(false)
    }
  }, [loadNews])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchNews()
          return 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [autoRefresh, fetchNews])

  const addRssSource = useCallback(async () => {
    if (!rssInput.trim()) {
      toast.error('Lutfen bir RSS URL\'si girin')
      return
    }

    try {
      let name = rssNameInput.trim()
      if (!name) {
        try {
          const urlObj = new URL(rssInput)
          name = urlObj.hostname.replace("www.", "").split(".")[0]
          name = name.charAt(0).toUpperCase() + name.slice(1) + " RSS"
        } catch {
          name = "Yeni Kaynak"
        }
      }

      await api.createRSSSource({ name, url: rssInput })
      toast.success('RSS kaynagi basariyla eklendi')
      setRssInput("")
      setRssNameInput("")
      await loadRSSSources()
    } catch (error: any) {
      console.error('Failed to add RSS source:', error)
      toast.error(error.message || 'RSS kaynagi eklenemedi')
    }
  }, [rssInput, rssNameInput, loadRSSSources])

  const removeRssSource = useCallback(async (id: number) => {
    try {
      await api.deleteRSSSource(id)
      toast.success('RSS kaynagi silindi')
      await loadRSSSources()
      await loadNews() // Reload news after deleting source
    } catch (error) {
      console.error('Failed to remove RSS source:', error)
      toast.error('RSS kaynagi silinemedi')
    }
  }, [loadRSSSources, loadNews])

  const handleNewsClick = (id: number) => {
    router.push(`/news/${id}`)
  }

  // Get unique companies for filter dropdown
  const uniqueCompanies = Array.from(new Set(news.map(item => item.company))).sort()

  const filteredNews = news.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary_tr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.from_location && item.from_location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.to_location && item.to_location.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchesScore = true
    if (scoreFilter === "high") matchesScore = item.score >= 80
    else if (scoreFilter === "watch") matchesScore = item.score >= 65 && item.score < 80
    else if (scoreFilter === "conditional") matchesScore = item.score >= 50 && item.score < 65
    else if (scoreFilter === "low") matchesScore = item.score < 50

    const matchesEvent = eventFilter === "all" || item.event_type === eventFilter
    const matchesCompany = companyFilter === "all" || item.company === companyFilter

    return matchesSearch && matchesScore && matchesEvent && matchesCompany
  })

  // Sort by date
  const sortedNews = [...filteredNews].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB
  })

  // Separate featured news (score >= 90) from regular news
  const featuredNews = sortedNews.filter(item => item.score >= 90)
  const regularNews = sortedNews.filter(item => item.score < 90)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-sidebar-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Fabrika Tasima Ajani
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Avrupa Haber Tarama Sistemi</p>
        </div>

        {/* Filters - Company & Sort */}
        <div className="p-4 border-b border-sidebar-border space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Şirket Filtresi
            </label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Tüm Şirketler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şirketler</SelectItem>
                {uniqueCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Sıralama
            </label>
            <Select value={sortOrder} onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeni → En Eski</SelectItem>
                <SelectItem value="oldest">En Eski → En Yeni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(companyFilter !== "all" || sortOrder !== "newest") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                setCompanyFilter("all")
                setSortOrder("newest")
              }}
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Filtreleri Sıfırla
            </Button>
          )}
        </div>

        {/* RSS Management */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">RSS Kaynakları</h2>

          {/* Add RSS */}
          <div className="space-y-2 mb-4">
            <Input
              type="text"
              placeholder="Kaynak adi (opsiyonel)..."
              value={rssNameInput}
              onChange={(e) => setRssNameInput(e.target.value)}
              className="flex-1 bg-secondary border-border"
            />
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="RSS URL'si girin..."
                value={rssInput}
                onChange={(e) => setRssInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRssSource()}
                className="flex-1 bg-secondary border-border"
              />
              <Button onClick={addRssSource} size="icon" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* RSS List */}
          <ScrollArea className="flex-1">
            <ul className="space-y-2">
              {rssSources.length === 0 ? (
                <li className="text-sm text-muted-foreground italic py-2">Henüz kaynak eklenmedi</li>
              ) : (
                rssSources.map((source) => (
                  <li
                    key={source.id}
                    className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeRssSource(source.id)}
                      aria-label={`${source.name} kaynağını sil`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">v1.0.0 MVP - Hackathon 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-sidebar border-b border-sidebar-border p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Haberlerde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-44 bg-secondary border-border">
                  <SelectValue placeholder="Tum Skorlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tum Skorlar</SelectItem>
                  <SelectItem value="high">Yuksek (80-100)</SelectItem>
                  <SelectItem value="watch">Izlenecek (65-79)</SelectItem>
                  <SelectItem value="conditional">Sartli (50-64)</SelectItem>
                  <SelectItem value="low">Dusuk (0-49)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <SelectValue placeholder="Tum Olaylar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tum Olaylar</SelectItem>
                  <SelectItem value="relocation">Tasinma</SelectItem>
                  <SelectItem value="new_plant">Yeni Tesis</SelectItem>
                  <SelectItem value="expansion">Genisleme</SelectItem>
                  <SelectItem value="closure">Kapanis</SelectItem>
                </SelectContent>
              </Select>

              {/* Auto Refresh Toggle */}
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Otomatik</span>
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  aria-label="Otomatik yenileme"
                />
                {autoRefresh && (
                  <span className="text-xs font-mono text-primary min-w-8">{countdown}s</span>
                )}
              </div>

              <Button onClick={fetchNews} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Yenile
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>

          {/* Last refresh info */}
          <div className="mt-2 text-xs text-muted-foreground">
            Son guncelleme: {mounted && lastRefresh ? lastRefresh.toLocaleTimeString("tr-TR") : "--:--:--"}
          </div>
        </header>

        {/* News Feed */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-4xl mx-auto space-y-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : sortedNews.length === 0 ? (
              <EmptyState 
                hasFilters={searchTerm !== "" || scoreFilter !== "all" || eventFilter !== "all" || companyFilter !== "all"} 
                onClearFilters={() => {
                  setSearchTerm("")
                  setScoreFilter("all")
                  setEventFilter("all")
                  setCompanyFilter("all")
                  setSortOrder("newest")
                }}
              />
            ) : (
              <>
                {/* Featured News Section */}
                {featuredNews.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      One Cikan Firsatlar
                    </h2>
                    {featuredNews.map((item) => (
                      <FeaturedNewsCard key={item.id} news={item} onClick={() => handleNewsClick(item.id)} />
                    ))}
                  </div>
                )}

                {/* Regular News */}
                {regularNews.length > 0 && (
                  <div className="space-y-4">
                    {featuredNews.length > 0 && (
                      <h2 className="text-lg font-semibold text-foreground mt-8">Diger Haberler</h2>
                    )}
                    {regularNews.map((item) => (
                      <NewsCard key={item.id} news={item} onClick={() => handleNewsClick(item.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
