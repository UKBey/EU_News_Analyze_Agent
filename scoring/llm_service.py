
import json
from google import genai
from google.genai import types

# API Key'ini buraya yaz
client = genai.Client(api_key="AIzaSyCL-kacoQLBeU79eYlg8jkfMNY-ejR1-Bs")

def analyze_article_with_llm(title: str, content: str) -> dict:
    """
    Haberi Gemini'a gönderip, dokümanda istenen yapılandırılmış JSON formatını çeker.
    """
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
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1, # Analiz için düşük yaratıcılık
                response_mime_type="application/json",
            )
        )
        
        # Gemini'dan gelen metni Python sözlüğüne çeviriyoruz
        result = json.loads(response.text)
        return result

    except Exception as e:
        print(f"❌ HATA: LLM API çağrısında bir sorun oluştu: {e}")
        # Hata durumunda fallback fonksiyonunu çağır
        return get_fallback_analysis(title)

def get_fallback_analysis(title: str) -> dict:
    """
    LLM API'si patlarsa veya timeout yerse çalışacak cankurtaran fonksiyonu.
    """
    title_lower = title.lower()
    event_type = "other"
    
    if any(word in title_lower for word in ["close", "shut down", "layoff"]):
        event_type = "closure"
    elif any(word in title_lower for word in ["move", "relocate"]):
        event_type = "relocation"
    elif any(word in title_lower for word in ["expand", "grow", "invest"]):
        event_type = "expansion"

    return {
        "event_type": event_type,
        "summary_tr": f"Otomatik analiz başarısız. Başlık: {title}",
        "company": None, "from_location": None, "to_location": None, 
        "sector": None, "score": 50, "confidence": 0.2
    }