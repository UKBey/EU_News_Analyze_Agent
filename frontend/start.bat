@echo off
echo Starting Frontend Development Server...
echo.
echo Make sure backend is running at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo.
echo Installing dependencies if needed...
call pnpm install
echo.
echo Starting Next.js development server...
call pnpm dev
