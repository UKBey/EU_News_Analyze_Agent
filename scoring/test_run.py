from rss_service import fetch_rss_feeds, DEMO_SOURCES
from llm_service import analyze_article_with_llm
from score_service import calculate_bios_fit_score # Skor servisimizi ekledik
import json

print("1. RSS verileri çekiliyor...")
haberler = fetch_rss_feeds([DEMO_SOURCES[2]]) # ECSB kaynağını çekiyor

if haberler:
    ilk_haber = haberler[0]
    print(f"\nSeçilen Haber: {ilk_haber['title']}")
    print("2. Gemini API'ye gönderiliyor. Lütfen bekleyin...\n")
    
    # LLM Analizi
    llm_sonuc = analyze_article_with_llm(ilk_haber["title"], ilk_haber["raw_summary"])
    
    print("3. BIOS-fit Skoru Hesaplanıyor...\n")
    # Skorlama
    final_sonuc = calculate_bios_fit_score(llm_sonuc, ilk_haber["link"])
    
    print("🎯 FİNAL ÇIKTI (LLM + SKOR):")
    print(json.dumps(final_sonuc, indent=4, ensure_ascii=False))
else:
    print("RSS'ten haber çekilemedi!")