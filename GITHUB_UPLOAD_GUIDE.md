# GitHub Upload Guide

## Repository Information
- **GitHub URL**: https://github.com/UKBey/EU_News_Analyze_Agent
- **Repository Name**: EU_News_Analyze_Agent

## Step-by-Step Upload Instructions

### 1. Initialize Git Repository
```bash
git init
```

### 2. Add Remote Repository
```bash
git remote add origin https://github.com/UKBey/EU_News_Analyze_Agent.git
```

### 3. Configure Git User (if not already configured)
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 4. Add All Files
```bash
git add .
```

### 5. Create Initial Commit
```bash
git commit -m "Initial commit: European Industrial News Scanning Agent

- FastAPI backend with SQLite database
- Next.js frontend with shadcn/ui components
- LLM integration with Gemini 1.5 Flash
- BIOS-Fit scoring system implementation
- RSS feed fetching and article management
- Automatic duplicate detection
- Dashboard statistics
- Demo seed data
- Comprehensive documentation"
```

### 6. Push to GitHub

#### Option A: If repository is empty (first time push)
```bash
git branch -M main
git push -u origin main
```

#### Option B: If repository already has content
```bash
git branch -M main
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Quick Commands (Copy-Paste)

### For Empty Repository:
```bash
git init
git remote add origin https://github.com/UKBey/EU_News_Analyze_Agent.git
git add .
git commit -m "Initial commit: European Industrial News Scanning Agent"
git branch -M main
git push -u origin main
```

### For Existing Repository:
```bash
git init
git remote add origin https://github.com/UKBey/EU_News_Analyze_Agent.git
git add .
git commit -m "Initial commit: European Industrial News Scanning Agent"
git branch -M main
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Troubleshooting

### If you get authentication error:
1. Use GitHub Personal Access Token instead of password
2. Or use SSH key authentication
3. Generate token at: https://github.com/settings/tokens

### If you get "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/UKBey/EU_News_Analyze_Agent.git
```

### If you get "branch main already exists":
```bash
git branch -D main
git branch -M main
```

## After Successful Push

1. Visit: https://github.com/UKBey/EU_News_Analyze_Agent
2. Verify all files are uploaded
3. Check that README.md displays correctly
4. Add topics/tags to repository (optional)
5. Add repository description (optional)

## Files That Will Be Uploaded

✅ Backend (FastAPI + SQLite)
✅ Frontend (Next.js + shadcn/ui)
✅ Documentation (README, guides, API docs)
✅ Configuration files (.gitignore, requirements.txt, package.json)
✅ Seed data and demo articles

## Files That Will Be Ignored (.gitignore)

❌ backend/venv/
❌ backend/__pycache__/
❌ backend/*.db (database files)
❌ backend/.env
❌ frontend/node_modules/
❌ frontend/.next/
❌ frontend/.env.local
❌ .DS_Store

## Next Steps After Upload

1. Add GitHub repository badges to README (optional)
2. Enable GitHub Pages for documentation (optional)
3. Set up GitHub Actions for CI/CD (optional)
4. Add collaborators if working in a team
5. Create releases/tags for versions
