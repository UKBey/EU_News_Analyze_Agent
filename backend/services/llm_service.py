import json
import os
import re
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    print("[WARN] groq paketi yüklü değil. Yüklemek için: pip install groq")
    GROQ_AVAILABLE = False
    Groq = None

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

client = None
if GROQ_AVAILABLE and GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        print(f"[OK] Groq LLM client initialized ({GROQ_MODEL})")
    except Exception as e:
        print(f"[WARN] Groq client initialization failed: {e}")
else:
    if not GROQ_API_KEY:
        print("[WARN] GROQ_API_KEY bulunamadı. .env dosyasını kontrol et.")
    print("[WARN] LLM olmadan çalışılıyor — yalnızca fallback analiz kullanılacak.")


SYSTEM_PROMPT = """Sen bir endüstriyel haber analistsin. Haberleri analiz edip yapılandırılmış JSON verisi çıkarıyorsun.

OLAY TİPLERİ:
- relocation: Fabrika/üretim hattının başka lokasyona taşınması
- closure: Tesis kapanışı, üretim durdurma, işten çıkarma
- expansion: Mevcut tesisin büyütülmesi, kapasite artışı
- new_plant: Yeni fabrika/tesis açılışı (greenfield)
- tender: İhale, tedarik, sözleşme duyurusu
- other: Yukarıdakilerin hiçbiri

SEKTÖRLER: automotive, technology, manufacturing, energy, logistics, retail, finance, healthcare, construction, agriculture, aerospace, chemicals, food, textiles, electronics

ZAMAN PENCERESİ (timeline) — olayın GERÇEKLEŞECEĞİ zamanı belirtir, haberin yayın tarihini değil:
- "0-6m": Olay 0-6 ay içinde gerçekleşecek veya yakın zamanda duyuruldu.
  Sinyaller: "announced", "will move", "will open", "will relocate", "in Q1/Q2/Q3/Q4",
  "this year", "this quarter", "next month", "opening soon", "imminently",
  "duyurdu", "açıkladı", "bu yıl", "bu çeyrekte", "yakında"
- "6-18m": 6-18 ay arası planlanmış.
  Sinyaller: "next year", "by [gelecek yıl]", "planned for [gelecek yıl]",
  "gelecek yıl", "önümüzdeki yıl"
- "18-36m": 18-36 ay arası uzun vadeli plan.
  Sinyaller: "by 2028", "by 2029", "long-term plan", "in the coming years",
  "uzun vadede", "orta vadeli"
- null: Metinde zaman sinyali yok veya belirtilmemiş

KURALLAR:
- Bilgi metinde yoksa null kullan (asla tahmin etme)
- summary_tr MUTLAKA Türkçe olmalı
- Şirket adını tam yaz
- Lokasyonları "Şehir, Ülke" formatında yaz
- SADECE geçerli JSON döndür, başka hiçbir şey yazma"""


class QuotaExhaustedError(Exception):
    """Groq API kotası bittiğinde fırlatılır — fallback kullanılmaz, işlem durur."""
    pass


def analyze_article_with_llm(title: str, content: str) -> dict:
    """Haberi Groq LLM ile analiz edip yapılandırılmış JSON döndürür."""
    if not client:
        return get_fallback_analysis(title, content)

    prompt = f"""HABER BAŞLIĞI: {title}

HABER METNİ: {content[:1500]}

Yukarıdaki haberi analiz et ve SADECE aşağıdaki JSON formatında yanıt ver:
{{
  "event_type": "relocation/closure/expansion/new_plant/tender/other",
  "summary_tr": "2-4 cümlelik Türkçe özet",
  "company": "Şirket adı veya null",
  "from_location": "Çıkış lokasyonu veya null",
  "to_location": "Hedef lokasyon veya null",
  "sector": "Sektör veya null",
  "timeline": "0-6m/6-18m/18-36m veya null",
  "score": 0,
  "confidence": 0.0
}}"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=512,
        )
        result = json.loads(response.choices[0].message.content)
        print(f"[OK] Groq analiz tamamlandı: {title[:60]}...")
        return result

    except Exception as e:
        error_type = type(e).__name__
        error_str = str(e)
        if "RateLimitError" in error_type or "rate_limit" in error_str.lower() or "429" in error_str:
            print(f"[HATA] Groq API kota limiti bitti: {e}")
            raise QuotaExhaustedError(f"Groq API kota limiti bitti: {error_str[:200]}")
        print(f"[ERROR] Groq API hatası ({error_type}): {e}")
        print(f"[ERROR] Fallback kullanılıyor → başlık: {title[:80]}")
        return get_fallback_analysis(title, content)


def _detect_timeline(title: str, content: str) -> str | None:
    """Haber metnindeki zaman sinyallerinden timeline kategorisi çıkarır."""
    combined = (title + " " + content).lower()
    current_year = datetime.now().year

    immediate = [
        "announced", "will move", "will open", "will relocate", "will close",
        "in q1", "in q2", "in q3", "in q4",
        "this year", "this quarter", "next month", "opening soon",
        "soon", "upcoming", "imminently", "shortly",
        "duyurdu", "açıkladı", "bu yıl", "yakında", "bu çeyrekte",
        str(current_year),
    ]
    short_term = [
        "next year", "by next year",
        "gelecek yıl", "önümüzdeki yıl",
        str(current_year + 1),
    ]
    medium_term = [
        "in the coming years", "long-term", "long term",
        "uzun vadede", "orta vadeli",
        str(current_year + 2), str(current_year + 3),
    ]

    if any(s in combined for s in immediate):
        return "0-6m"
    if any(s in combined for s in short_term):
        return "6-18m"
    if any(s in combined for s in medium_term):
        return "18-36m"
    return None


def get_fallback_analysis(title: str, content: str = "") -> dict:
    """LLM kullanılamadığında keyword eşleştirme ile temel analiz yapar."""
    title_lower = title.lower()
    content_lower = content.lower() if content else ""
    combined = title_lower + " " + content_lower

    event_type = "other"
    sector = None

    if any(w in combined for w in ["close", "closes", "closed", "closing", "shut down", "shutdown", "layoff", "layoffs", "closure", "shutting"]):
        event_type = "closure"
    elif any(w in combined for w in ["relocate", "relocates", "relocating", "relocation", "move", "moves", "moving", "transfer", "transfers"]):
        event_type = "relocation"
    elif any(w in combined for w in ["expand", "expands", "expanding", "expansion", "grow", "grows", "growing", "growth", "invest", "invests", "investment"]):
        event_type = "expansion"
    elif any(w in combined for w in ["new plant", "new facility", "new factory", "new site", "opening", "opens", "opened", "launch", "launches"]):
        event_type = "new_plant"
    elif any(w in combined for w in ["tender", "tenders", "bid", "bids", "bidding", "contract", "contracts"]):
        event_type = "tender"

    sector_keywords = {
        "automotive": ["car", "auto", "vehicle", "tesla", "ford", "bmw", "volkswagen", "toyota"],
        "technology": ["tech", "software", "ai", "digital", "data", "cloud", "microsoft", "google", "apple"],
        "manufacturing": ["factory", "plant", "production", "manufacturing", "assembly"],
        "energy": ["energy", "power", "solar", "wind", "electric", "battery", "renewable"],
        "logistics": ["warehouse", "logistics", "delivery", "shipping", "amazon", "dhl"],
        "retail": ["retail", "store", "shop", "supermarket", "mall"],
        "finance": ["bank", "finance", "financial", "investment", "insurance"],
        "aerospace": ["aerospace", "aircraft", "aviation", "airbus", "boeing"],
        "food": ["food", "beverage", "restaurant", "catering"],
    }
    for sector_name, keywords in sector_keywords.items():
        if any(k in combined for k in keywords):
            sector = sector_name
            break

    company = None
    stopwords = {
        "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "but",
        "how", "why", "what", "when", "where", "which", "who", "is", "are", "was",
        "your", "my", "our", "their", "this", "that", "these", "those", "from",
        "with", "will", "can", "may", "its", "by", "new", "all", "just", "not",
    }
    words = title.split()
    for i, word in enumerate(words):
        clean = word.strip("'\".,!?:")
        if clean and len(clean) > 2 and clean[0].isupper() and clean.lower() not in stopwords:
            company = clean
            if i + 1 < len(words) and words[i + 1][0].isupper():
                company = f"{clean} {words[i + 1].strip('.,!?:')}"
            break

    from_location = None
    to_location = None
    location_keywords = {
        "Germany": ["germany", "german", "berlin", "munich", "frankfurt", "hamburg"],
        "UK": ["united kingdom", "britain", "british", "london", "scotland", "edinburgh", "manchester"],
        "France": ["france", "french", "paris", "lyon"],
        "Poland": ["poland", "polish", "warsaw", "krakow"],
        "Turkey": ["turkey", "turkish", "istanbul", "ankara"],
        "Spain": ["spain", "spanish", "madrid", "barcelona"],
        "Italy": ["italy", "italian", "rome", "milan"],
        "Netherlands": ["netherlands", "dutch", "amsterdam"],
        "Belgium": ["belgium", "belgian", "brussels"],
        "Sweden": ["sweden", "swedish", "stockholm"],
        "Hungary": ["hungary", "hungarian", "budapest"],
        "Czech Republic": ["czech", "prague", "brno"],
        "Romania": ["romania", "romanian", "bucharest"],
        "Slovakia": ["slovakia", "slovak", "bratislava"],
    }
    for country, keywords in location_keywords.items():
        if any(re.search(r'\b' + re.escape(k) + r'\b', combined) for k in keywords):
            if event_type in ["relocation", "closure"]:
                from_location = country
            else:
                to_location = country
            break

    timeline = _detect_timeline(title, content)

    return {
        "event_type": event_type,
        "summary_tr": f"Otomatik analiz: {title[:200]}",
        "company": company,
        "from_location": from_location,
        "to_location": to_location,
        "sector": sector,
        "timeline": timeline,
        "score": 0,
        "confidence": 0.0,
    }
