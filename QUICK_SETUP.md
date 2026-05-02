# 🚀 Quick Setup - 5 Minutes to Running App

## Step 1: Start Backend (2 minutes)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

✅ Backend running at: **http://localhost:8000**
✅ Swagger UI at: **http://localhost:8000/docs**

---

## Step 2: Start Frontend (3 minutes)

**New terminal:**

```bash
cd frontend
pnpm install
pnpm dev
```

✅ Frontend running at: **http://localhost:3000**

---

## Step 3: Test the App

### 1. Open Browser
Go to: **http://localhost:3000**

### 2. Add RSS Source
- Name: `TechCrunch`
- URL: `https://techcrunch.com/feed/`
- Click "Add"

### 3. Refresh Articles
- Click "🔄 Yenile" button
- Wait for articles to load

### 4. Browse Articles
- Search, filter, and click on articles
- View details

---

## 🎉 Done!

Your app is now running with:
- ✅ Modern Next.js frontend
- ✅ FastAPI backend
- ✅ SQLite database
- ✅ RSS feed integration
- ✅ Real-time article fetching

---

## 📚 Next Steps

- **Add more RSS sources** in the sidebar
- **Filter articles** by score and event type
- **Search** for specific companies or locations
- **View article details** by clicking on cards

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Try Python 3.11 or 3.12 instead of 3.13
py -3.11 -m venv venv
```

### Frontend won't start?
```bash
# Use npm if pnpm not installed
npm install
npm run dev
```

### Can't connect?
- Check backend is running: http://localhost:8000/api/health
- Check frontend is running: http://localhost:3000
- Check `.env.local` in frontend folder

---

## 📖 Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Integration Guide](INTEGRATION_GUIDE.md)
- [API Guide](backend/API_GUIDE.md)

---

**Happy hacking! 🎉**
