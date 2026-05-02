# European Industrial News Scanner - Frontend

Modern Next.js 14 frontend with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or pnpm
- Backend running at http://localhost:8000

### Installation

```bash
cd frontend

# Install dependencies
pnpm install
# or
npm install

# Start development server
pnpm dev
# or
npm run dev
```

Open http://localhost:3000

## 🔧 Configuration

Create `.env.local` file (already created):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main dashboard page
│   ├── globals.css         # Global styles
│   └── news/
│       └── [id]/
│           └── page.tsx    # News detail page
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── theme-provider.tsx  # Theme provider component
├── lib/
│   ├── api.ts              # Backend API integration
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
└── styles/                 # Additional styles
```

## ✨ Features

### Dashboard
- ✅ RSS source management (add, delete)
- ✅ Article list with real-time data from backend
- ✅ Search and filtering (score, event type)
- ✅ Auto-refresh with countdown
- ✅ Dark/light theme toggle
- ✅ Company timeline
- ✅ Featured news section (score >= 90)

### News Detail
- ✅ Full article view
- ✅ Score visualization
- ✅ Location information
- ✅ Related news
- ✅ External link to original source

### UI Components
- Modern shadcn/ui components
- Responsive design
- Smooth animations
- Toast notifications
- Loading skeletons

## 🔌 Backend Integration

The frontend connects to the FastAPI backend through the API client in `lib/api.ts`.

### API Endpoints Used

```typescript
// RSS Sources
api.getRSSSources()
api.createRSSSource({ name, url, category })
api.deleteRSSSource(id)

// Articles
api.refreshArticles()
api.getArticles({ search, event_type, min_score, limit, offset })
api.getArticle(id)

// Stats
api.getStats()
```

### Data Flow

1. **Load RSS Sources**: Fetches from `GET /api/rss-sources`
2. **Load Articles**: Fetches from `GET /api/articles`
3. **Add Source**: Posts to `POST /api/rss-sources`
4. **Refresh Articles**: Posts to `POST /api/articles/refresh`
5. **Delete Source**: Deletes via `DELETE /api/rss-sources/{id}`

## 🎨 Styling

- **Framework**: Tailwind CSS 4.x
- **Components**: shadcn/ui
- **Theme**: Light/Dark mode with next-themes
- **Icons**: Lucide React

## 📱 Responsive Design

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🧪 Development

### Run Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

### Lint Code
```bash
pnpm lint
```

## 🔄 Auto-Refresh

The dashboard includes an optional auto-refresh feature:
- Toggle on/off with switch
- 60-second countdown
- Automatically fetches new articles
- Shows last refresh time

## 🎯 Event Types

- **Relocation** (Taşınma): Company moving facilities
- **New Plant** (Yeni Tesis): New facility opening
- **Expansion** (Genişleme): Business expansion
- **Closure** (Kapanış): Factory/office closure

## 📊 Score System

- **80-100**: High opportunity (green)
- **65-79**: Worth watching (blue)
- **50-64**: Conditional interest (yellow)
- **0-49**: Low relevance (gray)

## 🌐 Environment Variables

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_id_here
```

## 🐛 Troubleshooting

### Backend Connection Error

Make sure backend is running:
```bash
cd backend
uvicorn main:app --reload
```

Check backend health:
```bash
curl http://localhost:8000/api/health
```

### CORS Issues

Backend CORS is configured for:
- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:3000

If using different port, update backend `main.py`:
```python
cors_origins = ["http://localhost:YOUR_PORT"]
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

## 📝 Notes

- Uses Next.js 14 App Router
- Client-side rendering for dynamic content
- Toast notifications with sonner
- Type-safe API client
- Optimized images with next/image

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables on Vercel

Add in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### Other Platforms

Build and serve:
```bash
pnpm build
pnpm start
```

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Backend API Documentation](../backend/API_GUIDE.md)

## 👥 Team Integration

### For Backend Developer
- API client is in `lib/api.ts`
- All API calls use TypeScript types
- Error handling with toast notifications
- See `API_GUIDE.md` in backend folder

### For AI/RSS Developer
- Articles are displayed from backend
- Score and event_type are used for filtering
- All AI fields are displayed in UI
- See `AI_INTEGRATION_GUIDE.md` in backend folder

---

**Built for the European Industrial News Scanning Agent hackathon** 🎉

**Tech Stack**: Next.js 14 | TypeScript | Tailwind CSS | shadcn/ui | React 19
