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
    Sen bir endüstriyel haber analistsin. Aşağıdaki haber metninden olay tipini, 
    şirket adını, lokasyonları ve sektörü çıkar. Haberin Avrupa'daki bir fabrika 
    taşıması, kapanışı, genişlemesi veya yeni yatırımı ile ilgili olup olmadığına göre 
    0-100 arası alaka skoru ver. 
    
    Bilmediğin alanları null bırak. Özeti Türkçe yaz.
    """

    prompt = f"""
    HABER BAŞLIĞI: {title}
    METİN: {content}
    
    SADECE AŞAĞIDAKİ FORMATTA JSON DÖNDÜR:
    {{
      "event_type": "relocation | closure | expansion | new_plant | tender | other",
      "summary_tr": "Türkçe 2-4 cümlelik özet",
      "company": "Şirket adı veya null",
      "from_location": "Çıkış lokasyonu veya null",
      "to_location": "Hedef lokasyon veya null",
      "sector": "Sektör veya null",
      "score": 0,
      "confidence": 0.0
    }}
    """

    try:
        # Yeni genai SDK sözdizimi
        response = client.models.generate_content(
            model='gemini-1.5-flash',  # Stable model
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,  # Analiz için düşük yaratıcılık
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
    """
    title_lower = title.lower()
    content_lower = content.lower() if content else ""
    combined = title_lower + " " + content_lower
    
    event_type = "other"
    
    # Event type detection
    if any(word in combined for word in ["close", "shut down", "layoff", "closure", "closing"]):
        event_type = "closure"
    elif any(word in combined for word in ["move", "relocate", "relocation", "transfer"]):
        event_type = "relocation"
    elif any(word in combined for word in ["expand", "expansion", "grow", "invest", "investment"]):
        event_type = "expansion"
    elif any(word in combined for word in ["new plant", "new facility", "new factory", "opening"]):
        event_type = "new_plant"
    elif any(word in combined for word in ["tender", "bid", "contract"]):
        event_type = "tender"

    # Try to extract company name (very basic)
    company = None
    for word in title.split():
        if word[0].isupper() and len(word) > 3:
            company = word
            break

    return {
        "event_type": event_type,
        "summary_tr": f"Otomatik analiz: {title[:200]}",
        "company": company,
        "from_location": None,
        "to_location": None,
        "sector": None,
        "score": 50,
        "confidence": 0.2
    }
