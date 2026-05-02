import json
import os
import re
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

KURALLAR:
- Bilgi metinde yoksa null kullan (asla tahmin etme)
- summary_tr MUTLAKA Türkçe olmalı
- Şirket adını tam yaz
- Lokasyonları "Şehir, Ülke" formatında yaz
- SADECE geçerli JSON döndür, başka hiçbir şey yazma"""


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
        print(f"[ERROR] Groq API hatası ({type(e).__name__}): {e}")
        print(f"[ERROR] Fallback kullanılıyor → başlık: {title[:80]}")
        return get_fallback_analysis(title, content)


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

    return {
        "event_type": event_type,
        "summary_tr": f"Otomatik analiz: {title[:200]}",
        "company": company,
        "from_location": from_location,
        "to_location": to_location,
        "sector": sector,
        "score": 0,
        "confidence": 0.0,
    }
