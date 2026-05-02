from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routers import rss_router, article_router
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="European Industrial News Scanning Agent API",
    description="RSS-based AI-supported industrial news scanning backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rss_router)
app.include_router(article_router)


@app.get("/api/health")
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "message": "Industrial News Agent backend is running"
    }


@app.on_event("startup")
def startup_event():
    """
    Run on application startup.
    Seed the configured RSS sources.
    """
    print("[START] Starting Industrial News Scanning Agent API...")
    print("[OK] Database tables created successfully")
    
    # Seed RSS sources from scoring/rss_links.txt (uncomment to enable)
    # This will add 12 European business news sources
    db = SessionLocal()
    try:
        from seed.seed_rss_sources import seed_rss_sources
        seed_rss_sources(db, force=False)
    except Exception as e:
        print(f"[WARN] RSS source seeding skipped: {e}")
    finally:
        db.close()
    
    print("[OK] Application ready!")
    print("[AI] LLM analysis and BIOS-Fit scoring enabled")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
