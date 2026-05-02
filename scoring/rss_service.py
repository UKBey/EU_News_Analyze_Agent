import feedparser

# 1. HAMLE: Sitelerin bizi bot sanmasını engellemek için sahte bir tarayıcı kimliği atıyoruz
feedparser.USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

DEMO_SOURCES = [
    {"id": 1, "name": "EU Startups", "url": "https://www.eu-startups.com/feed/"},
    {"id": 2, "name": "EU Business News", "url": "https://eubusinessnews.com/feed"},
    {"id": 3, "name": "ECSB Research Blog", "url": "https://ecsbresearchblog.wordpress.com/feed/"},
    {"id": 4, "name": "The European", "url": "https://the-european.eu/feed"},
    {"id": 5, "name": "European Business Magazine", "url": "https://europeanbusinessmagazine.com/feed/"},
    {"id": 6, "name": "European Business Review", "url": "https://www.europeanbusinessreview.com/feed/"},
    {"id": 7, "name": "Entrepreneur", "url": "https://www.entrepreneur.com/rss-feed/latest"},
    {"id": 8, "name": "Fast Company", "url": "https://www.fastcompany.com/latest/rss?truncated=true"},
    {"id": 9, "name": "Small Business Trends", "url": "https://feeds.feedburner.com/SmallBusinessTrends/?feedId=220&uuid=JHEFJFpFDDIDMFLEDIDEFpFDMBEKEBHDBEDD"},
    {"id": 10, "name": "Inc. Magazine", "url": "https://www.inc.com/rss/"},
    {"id": 11, "name": "TechCrunch", "url": "https://techcrunch.com/feed/"},
    {"id": 12, "name": "VentureBeat", "url": "https://feeds.feedburner.com/venturebeat/SZYF"}
]

def fetch_rss_feeds(sources):
    all_articles = []
    
    for source in sources:
        print(f"\n📡 Çekiliyor: {source['name']} ({source['url']})")
        feed = feedparser.parse(source["url"])
        
        # 2. HAMLE: Hata yakalama mekanizması

        if feed.bozo:
            # Sadece uyarı basalım ama haberleri çekmeye devam edelim!
            print(f"⚠️ UYARI - {source['name']} XML formatında ufak bir bozukluk var ({feed.bozo_exception}). Kurtarılabilen haberler alınıyor...")
            
        if not feed.entries:
            # Eğer GERÇEKTEN hiç haber kurtaramadıysa o zaman atlayalım.
            status = feed.get('status', 'Bilinmiyor')
            print(f"❌ HATA - {source['name']} listesi tamamen boş veya ulaşılamıyor! HTTP Status: {status}")
            continue
            
        print(f"✅ BAŞARILI - {source['name']} kaynağından {len(feed.entries)} adet haber bulundu.")
        
        for entry in feed.entries:
            article = {
                "source_id": source["id"],
                "source_name": source["name"],
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "published_at": entry.get("published", ""), 
                "raw_summary": entry.get("summary", entry.get("description", ""))
            }
            all_articles.append(article)
            
    return all_articles

# Çıktıyı görelim
if __name__ == "__main__":
    haberler = fetch_rss_feeds(DEMO_SOURCES)
    print(f"\nToplam çekilen haber sayısı: {len(haberler)}")