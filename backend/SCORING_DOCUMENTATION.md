# BIOS-Fit Scoring System Documentation

## 📊 Overview

The BIOS-Fit scoring system analyzes industrial news articles and assigns a relevance score (0-100) based on multiple factors. This system combines LLM analysis with a mathematical scoring formula to identify high-value business opportunities.

---

## 🤖 LLM Analysis (Gemini 2.0 Flash)

### Input
- Article title
- Article summary/content

### Output (JSON)
```json
{
  "event_type": "relocation | closure | expansion | new_plant | tender | other",
  "summary_tr": "Turkish summary (2-4 sentences)",
  "company": "Company name or null",
  "from_location": "Origin location or null",
  "to_location": "Destination location or null",
  "sector": "Industry sector or null",
  "score": 0,
  "confidence": 0.0
}
```

### Prompt Strategy
The LLM is instructed to:
1. Identify the event type (relocation, closure, expansion, new plant, tender, other)
2. Extract company name, locations, and sector
3. Generate a Turkish summary
4. Leave unknown fields as null

---

## 📐 BIOS-Fit Score Formula

```
Score = 100 × (0.30E + 0.25A + 0.20G + 0.15T + 0.10C)
```

### Components

#### E - Event Type Score (Weight: 30%)
| Event Type | Score | Rationale |
|------------|-------|-----------|
| Relocation | 1.00 | Highest priority - direct factory movement |
| New Plant | 0.90 | Very high - new facility opening |
| Expansion | 0.75 | High - business growth |
| Tender | 0.55 | Medium - potential opportunity |
| Closure | 0.45 | Medium-low - negative but trackable |
| Other | 0.10 | Low - general news |

#### A - Actor Clarity Score (Weight: 25%)
Measures how much information is available:
- Company name: +0.40
- From location: +0.25
- To location: +0.25
- Sector: +0.10
- **Maximum**: 1.00

#### G - Geography Score (Weight: 20%)
| Location | Score | Keywords |
|----------|-------|----------|
| Europe | 1.00 | germany, france, poland, turkey, hungary, etc. |
| Unknown | 0.30 | No location mentioned |

#### T - Time Window Score (Weight: 15%)
| Timeframe | Score |
|-----------|-------|
| Specified | 0.80 |
| Unspecified | 0.30 |

*Currently defaulted to 0.30 as most RSS feeds don't specify future dates*

#### C - Source Trust Score (Weight: 10%)
| Source Type | Score | Examples |
|-------------|-------|----------|
| Premium News Agency | 0.85 | Reuters, Bloomberg |
| Industry Publication | 0.70 | Manufacturing Today, Industry Week |
| General News | 0.55 | TechCrunch, Business Insider |

---

## 🎯 Confidence Penalty

```python
filled_fields = count(company, from_location, to_location, sector, event_type != "other")
confidence = filled_fields / 5.0

if confidence < 0.40:
    score = score × 0.5  # Apply 50% penalty
```

This ensures that articles with incomplete information receive lower scores.

---

## 🎨 Color Labels

| Score Range | Label | Color | Meaning |
|-------------|-------|-------|---------|
| 80-100 | Yüksek Fırsat | Green | High opportunity - immediate action |
| 65-79 | İzlenecek | Blue | Worth watching - monitor developments |
| 50-64 | Şartlı İlgi | Yellow | Conditional interest - needs more info |
| 0-49 | Düşük Alaka | Gray | Low relevance - archive |

---

## 📝 Test Cases

### Test Case 1: High Score (Relocation)

**Input:**
```
Title: "BMW, Munih'teki üretim hattını Macaristan'a taşıyor"
Summary: "BMW, maliyetleri optimize etmek amacıyla Munih'teki bazı motor üretim 
hatlarını 2026 ilk çeyreginde Debrecen, Macaristan'a taşıyacağını duyurdu."
```

**LLM Output:**
```json
{
  "event_type": "relocation",
  "summary_tr": "BMW, Munih'teki motor üretim hatlarını Macaristan'ın Debrecen 
  şehrine taşıyor. Bu hamle, maliyetleri optimize etme ve Doğu Avrupa pazarına 
  daha yakın olma stratejisinin bir parçası.",
  "company": "BMW",
  "from_location": "Munih, Almanya",
  "to_location": "Debrecen, Macaristan",
  "sector": "Otomotiv"
}
```

**Score Calculation:**
```
E = 1.00 (relocation)
A = 1.00 (all fields filled: 0.40 + 0.25 + 0.25 + 0.10)
G = 1.00 (Europe: Germany → Hungary)
T = 0.30 (unspecified)
C = 0.85 (Reuters - premium source)

Score = 100 × (0.30×1.00 + 0.25×1.00 + 0.20×1.00 + 0.15×0.30 + 0.10×0.85)
Score = 100 × (0.30 + 0.25 + 0.20 + 0.045 + 0.085)
Score = 100 × 0.88
Score = 88

Confidence = 5/5 = 1.0 (no penalty)
Final Score = 88
Color Label = Green (Yüksek Fırsat)
```

---

### Test Case 2: Medium Score (Expansion)

**Input:**
```
Title: "Siemens, Polonya'da üretim kapasitesini artırıyor"
Summary: "Siemens, Polonya Wroclaw'daki tesisinde otomasyon ekipmanları üretim 
kapasitesini %40 artıracağını açıkladı."
```

**LLM Output:**
```json
{
  "event_type": "expansion",
  "summary_tr": "Siemens AG, Polonya'nın Wroclaw şehrindeki endüstriyel otomasyon 
  tesisinde önemli bir kapasite artışına gidiyor.",
  "company": "Siemens",
  "from_location": null,
  "to_location": "Wroclaw, Polonya",
  "sector": "Endüstriyel Otomasyon"
}
```

**Score Calculation:**
```
E = 0.75 (expansion)
A = 0.75 (company + to_location + sector: 0.40 + 0.25 + 0.10)
G = 1.00 (Europe: Poland)
T = 0.30 (unspecified)
C = 0.70 (Financial Times - industry publication)

Score = 100 × (0.30×0.75 + 0.25×0.75 + 0.20×1.00 + 0.15×0.30 + 0.10×0.70)
Score = 100 × (0.225 + 0.1875 + 0.20 + 0.045 + 0.07)
Score = 100 × 0.7275
Score = 72.75 → 72

Confidence = 4/5 = 0.8 (no penalty, > 0.40)
Final Score = 72
Color Label = Blue (İzlenecek)
```

---

### Test Case 3: Low Score (Other/Unclear)

**Input:**
```
Title: "Bosch yeni bir tesis açılışı planlıyor"
Summary: "Bosch, elektrikli araç bataryaları için yeni bir tesis kurmayı planlıyor 
ancak lokasyon henüz netleşmedi."
```

**LLM Output:**
```json
{
  "event_type": "new_plant",
  "summary_tr": "Bosch, elektrikli araç sektöründeki büyümesini desteklemek amacıyla 
  yeni bir batarya üretim tesisi kurmak için planlama aşamasında.",
  "company": "Bosch",
  "from_location": null,
  "to_location": null,
  "sector": "Otomotiv"
}
```

**Score Calculation:**
```
E = 0.90 (new_plant)
A = 0.50 (company + sector: 0.40 + 0.10)
G = 0.30 (unknown location)
T = 0.30 (unspecified)
C = 0.55 (general news)

Score = 100 × (0.30×0.90 + 0.25×0.50 + 0.20×0.30 + 0.15×0.30 + 0.10×0.55)
Score = 100 × (0.27 + 0.125 + 0.06 + 0.045 + 0.055)
Score = 100 × 0.555
Score = 55.5 → 55

Confidence = 3/5 = 0.6 (no penalty, > 0.40)
Final Score = 55
Color Label = Yellow (Şartlı İlgi)
```

---

## 🔄 Integration Flow

```
1. RSS Feed Fetch
   ↓
2. Duplicate Check (content_hash)
   ↓
3. LLM Analysis (Gemini)
   ↓
4. BIOS-Fit Score Calculation
   ↓
5. Database Storage
   ↓
6. Frontend Display
```

---

## 🛡️ Fallback Mechanism

If LLM API fails:
1. Use keyword-based event type detection
2. Extract basic information from title
3. Assign default score of 50
4. Set confidence to 0.2
5. Continue processing (don't crash)

---

## 📊 Score Distribution (Expected)

Based on typical RSS feeds:
- **Green (80-100)**: ~10-15% - High-value relocations and new plants
- **Blue (65-79)**: ~20-25% - Expansions and quality tenders
- **Yellow (50-64)**: ~30-35% - Conditional opportunities
- **Gray (0-49)**: ~30-40% - General news and closures

---

## 🎯 Optimization Tips

1. **Improve Geography Detection**: Add more European city/country keywords
2. **Time Window Parsing**: Extract dates from article content
3. **Source Trust**: Maintain a database of source reliability scores
4. **Sector Mapping**: Use industry taxonomy for better classification
5. **Multi-language Support**: Detect and translate non-English articles

---

## 📚 References

- Hackathon Documentation Section 7.4: BIOS-Fit Scoring System
- Gemini API Documentation: https://ai.google.dev/gemini-api/docs
- FastAPI Documentation: https://fastapi.tiangolo.com

---

**Last Updated**: May 2, 2026
**Version**: 1.0.0
**Author**: Hackathon Team - European Industrial News Scanner
