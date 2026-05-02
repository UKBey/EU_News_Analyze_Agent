import json
import os
from dotenv import load_dotenv

load_dotenv()

# Try to import Gemini, but don't fail if not available
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    print("⚠️ WARNING: google-genai not installed. Install with: pip install google-genai")
    GEMINI_AVAILABLE = False
    genai = None
    types = None

# API Key from environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCL-kacoQLBeU79eYlg8jkfMNY-ejR1-Bs")

# Initialize client if available
client = None
if GEMINI_AVAILABLE:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Gemini LLM client initialized successfully")
    except Exception as e:
        print(f"⚠️ WARNING: Gemini client initialization failed: {e}")
        client = None
else:
    print("⚠️ Running without LLM - using fallback analysis only")


def analyze_article_with_llm(title: str, content: str) -> dict:
    """
    Haberi Gemini'a gönderip, dokümanda istenen yapılandırılmış JSON formatını çeker.
    """
    if not client:
        print("⚠️ WARNING: Gemini client not available, using fallback")
        return get_fallback_analysis(title, content)
    
    system_instruction = """
    Sen bir endüstriyel haber analistsin. Görevin haberleri analiz edip yapılandırılmış veri çıkarmak.
    
    OLAY TİPLERİ:
    - relocation: Fabrika/şirket taşınması, yer değiştirme
    - closure: Fabrika/tesis kapanışı, işten çıkarmalar
    - expansion: Genişleme, büyüme, yeni yatırım (mevcut tesiste)
    - new_plant: Yeni fabrika/tesis açılışı
    - tender: İhale, teklif, sözleşme
    - other: Yukarıdakilerden hiçbiri (genel haberler, ürün lansmanları, vb.)
    
    SEKTÖRLER: automotive, technology, manufacturing, energy, logistics, retail, finance, healthcare, construction, agriculture, aerospace, chemicals, food, textiles, electronics
    
    ÖNEMLİ: 
    - Eğer bilgi metinde yoksa null yaz
    - Özeti mutlaka Türkçe yaz
    - Şirket adını tam olarak yaz (kısaltma değil)
    - Lokasyonları şehir ve ülke olarak belirt
    """

    prompt = f"""
    HABER BAŞLIĞI: {title}
    
    HABER METNİ: {content[:1000]}
    
    Bu haberi analiz et ve SADECE JSON formatında döndür:
    {{
      "event_type": "relocation/closure/expansion/new_plant/tender/other seçeneklerinden biri",
      "summary_tr": "Haberin Türkçe özeti (2-3 cümle)",
      "company": "Ana şirket adı (yoksa null)",
      "from_location": "Çıkış yeri: Şehir, Ülke (yoksa null)",
      "to_location": "Hedef yer: Şehir, Ülke (yoksa null)",
      "sector": "Sektör adı (yukardaki listeden, yoksa null)",
      "score": 0,
      "confidence": 0.0
    }}
    
    ÖRNEKLER:
    - "Tesla opens new factory in Berlin" → event_type: "new_plant", to_location: "Berlin, Germany", sector: "automotive"
    - "Amazon expands warehouse in Poland" → event_type: "expansion", to_location: "Poland", sector: "logistics"
    - "Ford closes UK plant" → event_type: "closure", from_location: "UK", sector: "automotive"
    """

    try:
        # Yeni genai SDK sözdizimi
        response = client.models.generate_content(
            model='gemini-1.5-flash',  # Stable model
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,  # Biraz daha yaratıcı analiz için
                response_mime_type="application/json",
            )
        )
        
        # Gemini'dan gelen metni Python sözlüğüne çeviriyoruz
        result = json.loads(response.text)
        return result

    except Exception as e:
        print(f"❌ HATA: LLM API çağrısında bir sorun oluştu: {e}")
        # Hata durumunda fallback fonksiyonunu çağır
        return get_fallback_analysis(title, content)


def get_fallback_analysis(title: str, content: str = "") -> dict:
    """
    LLM API'si patlarsa veya timeout yerse çalışacak cankurtaran fonksiyonu.
    Basit keyword matching ile analiz yapar.
    """
    title_lower = title.lower()
    content_lower = content.lower() if content else ""
    combined = title_lower + " " + content_lower
    
    event_type = "other"
    sector = None
    
    # Event type detection (daha kapsamlı keywords)
    if any(word in combined for word in ["close", "closes", "closed", "closing", "shut down", "shutdown", "layoff", "layoffs", "closure", "shutting"]):
        event_type = "closure"
    elif any(word in combined for word in ["relocate", "relocates", "relocating", "relocation", "move", "moves", "moving", "transfer", "transfers"]):
        event_type = "relocation"
    elif any(word in combined for word in ["expand", "expands", "expanding", "expansion", "grow", "grows", "growing", "growth", "invest", "invests", "investment"]):
        event_type = "expansion"
    elif any(word in combined for word in ["new plant", "new facility", "new factory", "new site", "opening", "opens", "opened", "launch", "launches"]):
        event_type = "new_plant"
    elif any(word in combined for word in ["tender", "tenders", "bid", "bids", "bidding", "contract", "contracts"]):
        event_type = "tender"

    # Sector detection
    sector_keywords = {
        "automotive": ["car", "auto", "vehicle", "tesla", "ford", "bmw", "volkswagen", "toyota"],
        "technology": ["tech", "software", "ai", "digital", "data", "cloud", "microsoft", "google", "apple"],
        "manufacturing": ["factory", "plant", "production", "manufacturing", "assembly"],
        "energy": ["energy", "power", "solar", "wind", "electric", "battery", "renewable"],
        "logistics": ["warehouse", "logistics", "delivery", "shipping", "amazon", "dhl"],
        "retail": ["retail", "store", "shop", "supermarket", "mall"],
        "finance": ["bank", "finance", "financial", "investment", "insurance"],
        "aerospace": ["aerospace", "aircraft", "aviation", "airbus", "boeing"],
        "food": ["food", "beverage", "restaurant", "catering"]
    }
    
    for sector_name, keywords in sector_keywords.items():
        if any(keyword in combined for keyword in keywords):
            sector = sector_name
            break

    # Try to extract company name (improved)
    company = None
    words = title.split()
    for i, word in enumerate(words):
        # Look for capitalized words that might be company names
        if word and len(word) > 2 and word[0].isupper():
            # Skip common words
            if word.lower() not in ["the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "but"]:
                company = word
                # Check if next word is also capitalized (multi-word company name)
                if i + 1 < len(words) and words[i + 1][0].isupper():
                    company = f"{word} {words[i + 1]}"
                break

    # Location detection (basic)
    from_location = None
    to_location = None
    
    location_keywords = {
        "Germany": ["germany", "german", "berlin", "munich", "frankfurt", "hamburg"],
        "UK": ["uk", "britain", "british", "london", "scotland", "edinburgh", "manchester"],
        "France": ["france", "french", "paris", "lyon"],
        "Poland": ["poland", "polish", "warsaw", "krakow"],
        "Turkey": ["turkey", "turkish", "istanbul", "ankara"],
        "Spain": ["spain", "spanish", "madrid", "barcelona"],
        "Italy": ["italy", "italian", "rome", "milan"],
        "Netherlands": ["netherlands", "dutch", "amsterdam"],
        "Belgium": ["belgium", "belgian", "brussels"],
        "Sweden": ["sweden", "swedish", "stockholm"],
        "Hungary": ["hungary", "hungarian", "budapest"]
    }
    
    for country, keywords in location_keywords.items():
        if any(keyword in combined for keyword in keywords):
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
        "score": 50,
        "confidence": 0.3
    }
