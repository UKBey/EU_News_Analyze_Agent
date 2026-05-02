# 🚀 Quick Start Guide - 2 Minutes to Running Backend

## Step 1: Navigate to Backend Folder
```bash
cd backend
```

## Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv

# Linux/Mac
python3 -m venv venv
```

## Step 3: Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

## Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

## Step 5: Start Backend
```bash
uvicorn main:app --reload
```

## ✅ Done! Backend is Running

### Access Points:
- **API Base**: http://localhost:8000/api
- **Swagger UI**: http://localhost:8000/docs ← **Start here!**
- **Health Check**: http://localhost:8000/api/health

---

## 🎯 First Steps in Swagger UI

1. Open http://localhost:8000/docs
2. Try **GET /api/health** - Click "Try it out" → "Execute"
3. Try **POST /api/rss-sources** - Add a test RSS source:
   ```json
   {
     "name": "TechCrunch",
     "url": "https://techcrunch.com/feed/",
     "category": "technology"
   }
   ```
4. Try **POST /api/articles/refresh** - Fetch articles
5. Try **GET /api/articles** - See the articles
6. Try **GET /api/stats** - View statistics

---

## 📚 Next Steps

### For Frontend Developer
→ Read **API_GUIDE.md** for complete API documentation

### For AI/RSS Teammate  
→ Read **AI_INTEGRATION_GUIDE.md** for LLM integration

### For Project Overview
→ Read **PROJECT_SUMMARY.md** for complete project details

---

## 🧪 Test Everything

```bash
# In a new terminal (keep backend running)
python test_api.py
```

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
uvicorn main:app --reload --port 8001
```

### "Module not found"
```bash
# Make sure venv is activated (you should see (venv) in terminal)
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Reinstall
pip install -r requirements.txt
```

### "Python not found"
```bash
# Try python3 instead of python
python3 -m venv venv
```

---

## 📦 What's Included

✅ 9 API endpoints (RSS sources, articles, stats)  
✅ SQLite database (auto-created)  
✅ Duplicate prevention  
✅ Search & filtering  
✅ Pagination  
✅ CORS enabled  
✅ Interactive API docs  
✅ Complete documentation  
✅ Test script  

---

## 🎉 You're Ready!

The backend is now running and ready for:
- Frontend integration
- AI/LLM integration  
- Hackathon demo

**Happy coding!** 🚀
