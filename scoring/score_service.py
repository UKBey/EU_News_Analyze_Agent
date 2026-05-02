import math

def calculate_bios_fit_score(llm_data: dict, source_url: str) -> dict:
    """
    Hackathon dokümanı 7.4'teki formüle göre BIOS-Fit skorunu hesaplar.
    """
    
    # 1. Olay Tipi Puanı (E)[cite: 1]
    e_val = 0.10 # default: other[cite: 1]
    event = llm_data.get("event_type", "other")
    if event == "relocation": e_val = 1.00
    elif event == "new_plant": e_val = 0.90
    elif event == "expansion": e_val = 0.75
    elif event == "tender": e_val = 0.55
    elif event == "closure": e_val = 0.45

    # 2. Aktör Netliği Puanı (A)[cite: 1]
    a_val = 0.0
    if llm_data.get("company"): a_val += 0.40
    if llm_data.get("from_location"): a_val += 0.25
    if llm_data.get("to_location"): a_val += 0.25
    if llm_data.get("sector"): a_val += 0.10

    # 3. Coğrafya Puanı (G)[cite: 1]
    g_val = 0.30 # Bilinmiyor
    loc_str = str(llm_data.get("from_location", "")) + str(llm_data.get("to_location", ""))
    eu_keywords = ["almanya", "fransa", "ingiltere", "türkiye", "macaristan", "avrupa", "germany", "france", "uk", "turkey", "hungary", "scotland", "edinburgh"]
    if any(k in loc_str.lower() for k in eu_keywords):
        g_val = 1.00 # Avrupa içi[cite: 1]

    # 4. Zaman Penceresi (T)[cite: 1]
    t_val = 0.30 # Belirtilmemiş varsayıyoruz[cite: 1]

    # 5. Kaynak Güveni (C)[cite: 1]
    c_val = 0.55 # Genel haber sitesi varsayımı[cite: 1]
    if "reuters" in source_url.lower() or "bloomberg" in source_url.lower():
        c_val = 0.85 # Saygın haber ajansı[cite: 1]
    elif "mfg" in source_url.lower() or "industry" in source_url.lower():
        c_val = 0.70 # Sektörel yayın[cite: 1]

    # Formül: Score = 100 x (0.30E + 0.25A + 0.20G + 0.15T + 0.10C)[cite: 1]
    raw_score = 100 * (0.30 * e_val + 0.25 * a_val + 0.20 * g_val + 0.15 * t_val + 0.10 * c_val)

    # Güven Puanı (Confidence)[cite: 1]
    filled_fields = 0
    for field in ["company", "from_location", "to_location", "sector", "event_type"]:
        if llm_data.get(field) and llm_data.get(field) != "other": 
            filled_fields += 1
    
    confidence = filled_fields / 5.0

    # Yumuşatma Cezası[cite: 1]
    if confidence < 0.40:
        raw_score = raw_score * 0.5

    llm_data["score"] = math.floor(raw_score)
    llm_data["confidence"] = confidence

    # Renk Etiketi Ekleme (Frontend için kolaylık)[cite: 1]
    score = llm_data["score"]
    if score >= 80: llm_data["color_label"] = "Yeşil"
    elif score >= 65: llm_data["color_label"] = "Mavi"
    elif score >= 50: llm_data["color_label"] = "Sarı"
    else: llm_data["color_label"] = "Gri"

    return llm_data