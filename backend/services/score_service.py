import math


def calculate_bios_fit_score(llm_data: dict, source_url: str) -> dict:
    """
    Hackathon dokümanı 7.4'teki formüle göre BIOS-Fit skorunu hesaplar.
    
    Formül: Score = 100 x (0.30E + 0.25A + 0.20G + 0.15T + 0.10C)
    
    E = Olay Tipi Puanı
    A = Aktör Netliği Puanı
    G = Coğrafya Puanı
    T = Zaman Penceresi
    C = Kaynak Güveni
    """
    
    # 1. Olay Tipi Puanı (E)
    e_val = 0.10  # default: other
    event = llm_data.get("event_type", "other")
    if event == "relocation":
        e_val = 1.00
    elif event == "new_plant":
        e_val = 0.90
    elif event == "expansion":
        e_val = 0.75
    elif event == "tender":
        e_val = 0.55
    elif event == "closure":
        e_val = 0.45

    # 2. Aktör Netliği Puanı (A)
    a_val = 0.0
    if llm_data.get("company"):
        a_val += 0.40
    if llm_data.get("from_location"):
        a_val += 0.25
    if llm_data.get("to_location"):
        a_val += 0.25
    if llm_data.get("sector"):
        a_val += 0.10

    # 3. Coğrafya Puanı (G)
    g_val = 0.30  # Bilinmiyor
    loc_str = str(llm_data.get("from_location", "")) + str(llm_data.get("to_location", ""))
    eu_keywords = [
        "almanya", "fransa", "ingiltere", "türkiye", "macaristan", "avrupa",
        "germany", "france", "uk", "turkey", "hungary", "scotland", "edinburgh",
        "poland", "polonya", "czech", "çek", "romania", "romanya", "italy", "italya",
        "spain", "ispanya", "portugal", "portekiz", "netherlands", "hollanda",
        "belgium", "belçika", "austria", "avusturya", "sweden", "isveç",
        "denmark", "danimarka", "finland", "finlandiya", "norway", "norveç",
        "ireland", "irlanda", "greece", "yunanistan", "bulgaria", "bulgaristan"
    ]
    if any(k in loc_str.lower() for k in eu_keywords):
        g_val = 1.00  # Avrupa içi

    # 4. Zaman Penceresi (T)
    t_val = 0.30  # Belirtilmemiş varsayıyoruz

    # 5. Kaynak Güveni (C)
    c_val = 0.55  # Genel haber sitesi varsayımı
    source_lower = source_url.lower()
    if "reuters" in source_lower or "bloomberg" in source_lower:
        c_val = 0.85  # Saygın haber ajansı
    elif "mfg" in source_lower or "industry" in source_lower or "business" in source_lower:
        c_val = 0.70  # Sektörel yayın

    # Formül: Score = 100 x (0.30E + 0.25A + 0.20G + 0.15T + 0.10C)
    raw_score = 100 * (0.30 * e_val + 0.25 * a_val + 0.20 * g_val + 0.15 * t_val + 0.10 * c_val)

    # Güven Puanı (Confidence) — event_type her zaman dolu sayılır ("other" dahil)
    filled_fields = 0
    for field in ["company", "from_location", "to_location", "sector", "event_type"]:
        if llm_data.get(field):
            filled_fields += 1
    
    confidence = filled_fields / 5.0

    # Yumuşatma Cezası
    if confidence < 0.40:
        raw_score = raw_score * 0.5

    llm_data["score"] = round(raw_score)
    llm_data["confidence"] = round(confidence, 2)

    # Renk Etiketi Ekleme (Frontend için kolaylık)
    score = llm_data["score"]
    if score >= 80:
        llm_data["color_label"] = "green"
        llm_data["action_label"] = "Yüksek Fırsat"
    elif score >= 65:
        llm_data["color_label"] = "blue"
        llm_data["action_label"] = "İzlenecek"
    elif score >= 50:
        llm_data["color_label"] = "yellow"
        llm_data["action_label"] = "Şartlı İlgi"
    else:
        llm_data["color_label"] = "gray"
        llm_data["action_label"] = "Düşük Alaka"

    return llm_data


def get_score_breakdown(llm_data: dict, source_url: str) -> dict:
    """
    Skor hesaplama detaylarını döndürür (debugging ve dokümantasyon için).
    """
    event = llm_data.get("event_type", "other")
    e_val = {"relocation": 1.00, "new_plant": 0.90, "expansion": 0.75, 
             "tender": 0.55, "closure": 0.45}.get(event, 0.10)
    
    a_val = 0.0
    if llm_data.get("company"): a_val += 0.40
    if llm_data.get("from_location"): a_val += 0.25
    if llm_data.get("to_location"): a_val += 0.25
    if llm_data.get("sector"): a_val += 0.10
    
    loc_str = str(llm_data.get("from_location", "")) + str(llm_data.get("to_location", ""))
    g_val = 1.00 if any(k in loc_str.lower() for k in ["almanya", "germany", "europe", "avrupa"]) else 0.30
    
    t_val = 0.30
    
    source_lower = source_url.lower()
    if "reuters" in source_lower or "bloomberg" in source_lower:
        c_val = 0.85
    elif "industry" in source_lower or "business" in source_lower:
        c_val = 0.70
    else:
        c_val = 0.55
    
    return {
        "event_type_score": e_val,
        "actor_clarity_score": a_val,
        "geography_score": g_val,
        "time_window_score": t_val,
        "source_trust_score": c_val,
        "formula": "100 x (0.30E + 0.25A + 0.20G + 0.15T + 0.10C)",
        "calculation": f"100 x (0.30×{e_val} + 0.25×{a_val} + 0.20×{g_val} + 0.15×{t_val} + 0.10×{c_val})"
    }
