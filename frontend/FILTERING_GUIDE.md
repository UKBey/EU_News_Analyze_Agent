# 🔍 Filtreleme ve Sıralama Rehberi

## Yeni Özellikler

### 1. Şirket Filtresi
- **Konum**: Sol sidebar, en üstte
- **Özellik**: Haberleri şirketlere göre filtreler
- **Nasıl Çalışır**: 
  - Dropdown'dan bir şirket seçin
  - Sadece o şirketle ilgili haberler gösterilir
  - LLM servisi her haberi analiz ederken şirket adını çıkarır
  - Şirket listesi otomatik olarak güncellenir

### 2. Tarih Sıralaması
- **Konum**: Sol sidebar, şirket filtresinin altında
- **Seçenekler**:
  - **En Yeni → En Eski** (varsayılan): Son haberler önce
  - **En Eski → En Yeni**: Eski haberler önce
- **Kullanım**: Şirket geçmişini kronolojik olarak takip etmek için

### 3. Arama Kutusu
- **Konum**: Üst header, sol tarafta
- **Arama Yapılan Alanlar**:
  - Haber başlığı
  - Özet (summary_tr)
  - Şirket adı
  - Lokasyonlar (from_location, to_location)
- **Örnek**: "Tesla" yazarsanız Tesla ile ilgili tüm haberler çıkar

## Filtreleme Kombinasyonları

### Örnek 1: Belirli Bir Şirketin Tüm Haberleri
1. Şirket filtresinden "BMW" seçin
2. Tarih sıralamasını "En Eski → En Yeni" yapın
3. BMW'nin zaman içindeki tüm haberlerini kronolojik sırada görün

### Örnek 2: Yüksek Skorlu Taşınma Haberleri
1. Skor filtresi: "Yüksek (80-100)"
2. Olay tipi: "Taşınma"
3. Şirket: "Tüm Şirketler"
4. Sonuç: Yüksek potansiyelli taşınma haberleri

### Örnek 3: Belirli Şirketin Genişleme Haberleri
1. Şirket: "Siemens"
2. Olay tipi: "Genişleme"
3. Sıralama: "En Yeni → En Eski"
4. Sonuç: Siemens'in son genişleme haberleri

## Filtreleri Sıfırlama

### Yöntem 1: Sidebar'daki Buton
- Şirket filtresi veya sıralama değiştirildiğinde
- "Filtreleri Sıfırla" butonu görünür
- Tek tıkla tüm filtreler varsayılana döner

### Yöntem 2: Header'daki Filtreler
- Skor filtresi: "Tüm Skorlar"
- Olay tipi: "Tüm Olaylar"
- Arama kutusunu temizleyin

### Yöntem 3: Sonuç Bulunamadı Ekranı
- Hiç sonuç yoksa "Filtreleri Temizle" butonu görünür
- Tüm filtreleri tek seferde sıfırlar

## LLM Entegrasyonu

### Şirket Adı Çıkarma
LLM servisi (`backend/services/llm_service.py`) her haberi analiz ederken:

```python
{
  "company": "Tesla",  # Şirket adı otomatik çıkarılır
  "event_type": "expansion",
  "from_location": "Berlin, Germany",
  "to_location": null,
  "sector": "automotive"
}
```

### Fallback Sistemi
LLM başarısız olursa, fallback sistemi devreye girer:
- Başlıktaki büyük harfle başlayan kelimeler
- Bilinen şirket isimleri
- Multi-word company names (örn: "Mercedes-Benz")

## Kullanım Senaryoları

### Senaryo 1: Rakip Analizi
**Amaç**: BMW'nin son 6 aydaki tüm aktivitelerini görmek

1. Şirket: "BMW"
2. Sıralama: "En Yeni → En Eski"
3. Skor: "Tüm Skorlar"
4. Sonuç: BMW'nin tüm haberleri tarih sırasıyla

### Senaryo 2: Yatırım Fırsatları
**Amaç**: Yüksek skorlu yeni tesis haberleri

1. Skor: "Yüksek (80-100)"
2. Olay tipi: "Yeni Tesis"
3. Şirket: "Tüm Şirketler"
4. Sonuç: En iyi yatırım fırsatları

### Senaryo 3: Sektör Analizi
**Amaç**: Otomotiv sektöründeki taşınmalar

1. Arama: "automotive" veya "otomotiv"
2. Olay tipi: "Taşınma"
3. Sıralama: "En Yeni → En Eski"
4. Sonuç: Sektördeki son taşınmalar

### Senaryo 4: Lokasyon Bazlı Analiz
**Amaç**: Almanya'ya yapılan yatırımlar

1. Arama: "Germany" veya "Almanya"
2. Olay tipi: "Yeni Tesis" veya "Genişleme"
3. Skor: "Yüksek (80-100)"
4. Sonuç: Almanya'daki yeni yatırımlar

## Teknik Detaylar

### Frontend State Management
```typescript
const [companyFilter, setCompanyFilter] = useState<string>("all")
const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
```

### Filtreleme Mantığı
```typescript
const filteredNews = news.filter((item) => {
  const matchesCompany = companyFilter === "all" || item.company === companyFilter
  const matchesSearch = /* arama mantığı */
  const matchesScore = /* skor mantığı */
  const matchesEvent = /* olay tipi mantığı */
  
  return matchesSearch && matchesScore && matchesEvent && matchesCompany
})
```

### Sıralama Mantığı
```typescript
const sortedNews = [...filteredNews].sort((a, b) => {
  const dateA = new Date(a.date).getTime()
  const dateB = new Date(b.date).getTime()
  return sortOrder === "newest" ? dateB - dateA : dateA - dateB
})
```

## Performans

- **Şirket Listesi**: Otomatik olarak unique şirketlerden oluşur
- **Filtreleme**: Client-side, anlık sonuç
- **Sıralama**: Client-side, anlık sonuç
- **Arama**: Tüm alanlarda case-insensitive

## Gelecek İyileştirmeler

1. **Çoklu Şirket Seçimi**: Birden fazla şirketi aynı anda filtreleme
2. **Tarih Aralığı**: Belirli tarihler arası filtreleme
3. **Kaydetme**: Favori filtreleri kaydetme
4. **Export**: Filtrelenmiş sonuçları CSV/Excel'e aktarma
5. **Grafikler**: Şirket bazlı istatistikler ve grafikler

## Sorun Giderme

### Şirket Listesi Boş
- Backend'den haberler çekilmemiş olabilir
- "Haberleri Yenile" butonuna tıklayın
- LLM servisi şirket adlarını çıkaramıyor olabilir

### Filtreleme Çalışmıyor
- Tarayıcıyı yenileyin (F5)
- Filtreleri sıfırlayın
- Console'da hata var mı kontrol edin

### Sıralama Çalışmıyor
- Haberlerin tarih bilgisi eksik olabilir
- Backend'den gelen `published_at` alanını kontrol edin

---

**Hazırlayan**: Kiro AI Assistant
**Tarih**: 2 Mayıs 2026
**Versiyon**: 1.0.0
