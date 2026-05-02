@echo off
echo.
echo ========================================
echo   RSS Sources Seeding Script
echo ========================================
echo.

cd /d "%~dp0"

if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv venv
    pause
    exit /b 1
)

call venv\Scripts\activate

echo Running seed script...
echo.

python seed\seed_rss_sources.py

echo.
echo ========================================
echo   Seeding Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: uvicorn main:app --reload
echo 2. Open frontend: http://localhost:3000
echo 3. Click "Refresh" to fetch articles
echo.
pause
