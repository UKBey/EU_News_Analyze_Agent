# 🌱 Quick Seed Guide - RSS Sources & Demo Data

## 🚀 Option 1: Automatic Seeding (Recommended)

RSS sources are automatically loaded when you start the backend!

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

The backend will automatically:
- ✅ Load 12 RSS sources from `scoring/rss_links.txt`
- ✅ Skip if sources already exist
- ✅ Show summary in console

---

## 🔧 Option 2: Manual Seeding

If you want to manually seed RSS sources:

### Windows
```bash
cd backend
seed_sources.bat
```

### Linux/Mac
```bash
cd backend
source venv/bin/activate
python seed/seed_rss_sources.py
```

---

## 📰 RSS Sources Included

The following 12 sources will be added:

| # | Source Name | Category | URL |
|---|-------------|----------|-----|
| 1 | EU Startups | startups | https://www.eu-startups.com/feed/ |
| 2 | EU Business News | business | https://eubusinessnews.com/feed |
| 3 | ECSB Research Blog | research | https://ecsbresearchblog.wordpress.com/feed/ |
| 4 | The European | news | https://the-european.eu/feed |
| 5 | European Business Magazine | business | https://europeanbusinessmagazine.com/feed/ |
| 6 | European Business Review | business | https://www.europeanbusinessreview.com/feed/ |
| 7 | Entrepreneur | business | https://www.entrepreneur.com/rss-feed/latest |
| 8 | Fast Company | business | https://www.fastcompany.com/latest/rss |
| 9 | Small Business Trends | business | https://feeds.feedburner.com/SmallBusinessTrends/ |
| 10 | Inc. Magazine | business | https://www.inc.com/rss/ |
| 11 | TechCrunch | technology | https://techcrunch.com/feed/ |
| 12 | VentureBeat | technology | https://feeds.feedburner.com/venturebeat/SZYF |

---

## 🎯 After Seeding

### 1. Start Backend (if not already running)
```bash
uvicorn main:app --reload
```

### 2. Open Frontend
```
http://localhost:3000
```

### 3. Refresh Articles
Click the **"🔄 Yenile"** button in the frontend

This will:
- Fetch articles from all 12 RSS sources
- Analyze each article with LLM (Gemini)
- Calculate BIOS-Fit scores
- Assign color labels
- Save to database

**Note**: First refresh may take 2-5 minutes depending on:
- Number of articles
- LLM API response time
- Network speed

---

## 📊 Expected Results

After refresh, you should see:
- **50-200 articles** (depending on RSS feed activity)
- **Score distribution**:
  - Green (80-100): ~10-15% - High opportunities
  - Blue (65-79): ~20-25% - Worth watching
  - Yellow (50-64): ~30-35% - Conditional
  - Gray (0-49): ~30-40% - Low relevance

---

## 🎭 Demo Data (For Presentations)

If you need guaranteed demo data for hackathon presentation:

```bash
cd backend
python seed/load_demo_articles.py
```

This loads 6 pre-scored articles covering all score ranges.

**When to use:**
- During hackathon presentation
- When RSS sources have no new articles
- For testing frontend without waiting for LLM

---

## 🔄 Re-seeding

To add sources again (if you deleted them):

```bash
cd backend
python seed/seed_rss_sources.py
```

The script will:
- ✅ Skip existing sources (no duplicates)
- ✅ Add only new sources
- ✅ Show summary

---

## 🐛 Troubleshooting

### "Database already has X RSS sources"
This is normal! Sources are already loaded. Just click refresh in frontend.

### "Failed to validate RSS URL"
Some RSS feeds may be temporarily unavailable. The script will skip them and continue.

### "No articles after refresh"
- Check if RSS sources are active
- Try refreshing again (some feeds update slowly)
- Load demo data for testing

### "LLM analysis failed"
- Check GEMINI_API_KEY in .env file
- Backend will use fallback analysis (keyword-based)
- Articles will still be saved with default scores

---

## 📝 Summary

**Easiest way:**
1. Start backend → RSS sources auto-load
2. Open frontend → Click refresh
3. Wait 2-5 minutes → Articles appear with scores!

**For demo:**
1. Load demo data: `python seed/load_demo_articles.py`
2. Start backend
3. Open frontend → Articles already there!

---

**Happy seeding! 🌱**
