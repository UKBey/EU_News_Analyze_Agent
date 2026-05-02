# 🔄 Backend'i Yeniden Başlatma Talimatları

## LLM Servisi İyileştirildi

Aşağıdaki iyileştirmeler yapıldı:

### 1. Daha İyi Prompt Engineering
- ✅ Olay tipleri daha net açıklandı
- ✅ Sektör listesi eklendi
- ✅ Örnekler eklendi
- ✅ Lokasyon formatı netleştirildi

### 2. Geliştirilmiş Fallback Sistemi
- ✅ Daha fazla keyword eklendi
- ✅ Sektör tespiti eklendi
- ✅ Lokasyon tespiti eklendi
- ✅ Şirket adı çıkarma iyileştirildi

### 3. Temperature Ayarı
- ✅ 0.1'den 0.3'e çıkarıldı (daha yaratıcı analiz)

## Backend'i Yeniden Başlatma

### Adım 1: Mevcut Backend'i Durdurun
Terminal'de `Ctrl+C` tuşlarına basın

### Adım 2: Backend'i Tekrar Başlatın

```bash
cd backend
python -m uvicorn main:app --reload
```

veya Windows için:

```bash
cd backend
start.bat
```

### Adım 3: Mevcut Haberleri Yeniden Analiz Edin

Backend başladıktan sonra, mevcut haberleri yeniden analiz etmek için:

**Seçenek 1: Frontend'den**
- "Haberleri Yenile" butonuna tıklayın
- Yeni haberler çekilecek ve analiz edilecek

**Seçenek 2: API'den**
```bash
curl -X POST http://localhost:8000/api/articles/refresh
```

**Seçenek 3: Swagger UI'dan**
1. http://localhost:8000/docs adresine gidin
2. `POST /api/articles/refresh` endpoint'ini bulun
3. "Try it out" → "Execute" tıklayın

## Beklenen İyileştirmeler

### Önceki Durum:
- ❌ Birçok haber "unknown" olarak kategorize ediliyordu
- ❌ Sektör bilgisi eksikti
- ❌ Lokasyon bilgisi eksikti

### Yeni Durum:
- ✅ Daha doğru event_type tespiti
- ✅ Sektör bilgisi çıkarılıyor
- ✅ Lokasyon bilgisi çıkarılıyor
- ✅ Şirket adları daha iyi tespit ediliyor
- ✅ Fallback sistemi daha akıllı

## Test Etme

Yeni haberler çektikten sonra kontrol edin:

1. **Event Type**: "other" yerine doğru kategoriler görünmeli
   - relocation
   - closure
   - expansion
   - new_plant
   - tender

2. **Sector**: Boş yerine sektör bilgisi olmalı
   - automotive
   - technology
   - manufacturing
   - energy
   - logistics
   - vb.

3. **Location**: Şehir ve ülke bilgisi olmalı
   - "Berlin, Germany"
   - "London, UK"
   - "Warsaw, Poland"

4. **Company**: Şirket adları daha net olmalı
   - "Tesla"
   - "Amazon"
   - "Ford"

## Sorun Giderme

### Hala "unknown" görünüyorsa:

1. **Gemini API Key'i kontrol edin**:
   ```bash
   cd backend
   cat .env
   ```
   GEMINI_API_KEY doğru mu?

2. **LLM servisinin çalıştığını kontrol edin**:
   Backend başlarken şu mesajı görmelisiniz:
   ```
   ✅ Gemini LLM client initialized successfully
   ```

3. **Haber içeriğini kontrol edin**:
   Bazı RSS feedleri sadece başlık veriyor, içerik vermiyor.
   Bu durumda LLM yeterli bilgi bulamayabilir.

4. **Fallback sistemini test edin**:
   Gemini çalışmasa bile fallback sistemi devreye girmeli.

## Debugging

Backend loglarını izleyin:
```bash
cd backend
python -m uvicorn main:app --reload --log-level debug
```

Her haber analiz edilirken console'da göreceksiniz:
- ✅ Başarılı analizler
- ⚠️ Fallback kullanımları
- ❌ Hatalar

---

**Hazır mısınız?** Backend'i yeniden başlatın ve haberleri yenileyin!
