@echo off
echo Starting European Industrial News Scanning Agent Backend...
echo.

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI server...
echo API will be available at: http://localhost:8000
echo Swagger UI: http://localhost:8000/docs
echo.

uvicorn main:app --reload
