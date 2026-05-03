from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from datetime import datetime
import time
import json
from database import get_db
from models import RSSSource, Article, ArticleNote
from schemas import ArticleResponse, ArticleListResponse, RefreshResponse, StatsResponse, ScoreBreakdownResponse, ArticleUpdateRequest
from services import fetch_articles_from_source, generate_content_hash, get_dashboard_stats
from services.llm_service import analyze_article_with_llm, QuotaExhaustedError
from services.score_service import calculate_bios_fit_score, compute_breakdown_from_article

LLM_RATE_LIMIT_DELAY = 2.0

router = APIRouter(prefix="/api", tags=["Articles"])


def _sse(data: dict, event: str = "") -> str:
    """SSE satırı üretir: data satırı (ve varsa event tipi)."""
    prefix = f"event: {event}\n" if event else ""
    return f"{prefix}data: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"


@router.post("/articles/refresh/stream")
def refresh_articles_stream(
    max_per_source: int = Query(5, ge=1, le=100),
    source_id: Optional[int] = Query(None, description="Sadece bu kaynaktan çek (None = tümü)"),
    db: Session = Depends(get_db),
):
    """
    RSS kaynaklarından haberleri çeker; her haber işlendiğinde SSE olarak anlık gönderir.
    event: article  → yeni haber JSON
    event: done     → özet {new_articles, duplicates_skipped, errors}
    event: error    → kota/hata mesajı
    """
    def generate():
        q = db.query(RSSSource).filter(RSSSource.is_active == True)
        if source_id is not None:
            q = q.filter(RSSSource.id == source_id)
        sources = q.all()
        new_articles = 0
        duplicates_skipped = 0
        errors = []

        for source in sources:
            try:
                articles_data = fetch_articles_from_source(source, max_per_source=max_per_source)

                for article_data in articles_data:
                    content_hash = generate_content_hash(article_data["title"], article_data["link"])

                    if db.query(Article).filter(Article.content_hash == content_hash).first():
                        duplicates_skipped += 1
                        continue

                    try:
                        time.sleep(LLM_RATE_LIMIT_DELAY)
                        llm_result = analyze_article_with_llm(
                            article_data["title"],
                            article_data["raw_summary"] or ""
                        )
                        scored_result = calculate_bios_fit_score(llm_result, source.url)

                        new_article = Article(
                            source_id=article_data["source_id"],
                            source_name=article_data["source_name"],
                            title=article_data["title"],
                            link=article_data["link"],
                            published_at=article_data["published_at"],
                            raw_summary=article_data["raw_summary"],
                            content_hash=content_hash,
                            event_type=scored_result.get("event_type", "other"),
                            summary_tr=scored_result.get("summary_tr", article_data["raw_summary"]),
                            company=scored_result.get("company"),
                            from_location=scored_result.get("from_location"),
                            to_location=scored_result.get("to_location"),
                            sector=scored_result.get("sector"),
                            timeline=scored_result.get("timeline"),
                            score=scored_result.get("score", 0),
                            confidence=scored_result.get("confidence", 0.0),
                            action_label=scored_result.get("action_label", "Düşük Alaka"),
                            color_label=scored_result.get("color_label", "gray"),
                        )
                        db.add(new_article)
                        db.commit()
                        db.refresh(new_article)
                        new_articles += 1

                        # Her haber hemen stream edilir
                        yield _sse(
                            ArticleResponse.model_validate(new_article).model_dump(mode="json"),
                            event="article",
                        )

                    except QuotaExhaustedError:
                        db.commit()
                        yield _sse(
                            {"message": f"API kota limiti bitti. {new_articles} haber kaydedildi."},
                            event="error",
                        )
                        return

                    except Exception as llm_error:
                        print(f"[WARN] LLM hatası: {article_data['title'][:50]}... {llm_error}")
                        fallback = Article(
                            source_id=article_data["source_id"],
                            source_name=article_data["source_name"],
                            title=article_data["title"],
                            link=article_data["link"],
                            published_at=article_data["published_at"],
                            raw_summary=article_data["raw_summary"],
                            content_hash=content_hash,
                            event_type="other",
                            summary_tr=article_data["raw_summary"] or "AI analiz bekliyor",
                            score=0,
                            confidence=0.0,
                            action_label="Düşük Alaka",
                            color_label="gray",
                        )
                        db.add(fallback)
                        db.commit()
                        db.refresh(fallback)
                        new_articles += 1
                        yield _sse(
                            ArticleResponse.model_validate(fallback).model_dump(mode="json"),
                            event="article",
                        )

                source.last_fetched_at = datetime.utcnow()
                db.commit()

            except Exception as e:
                errors.append(f"{source.name}: {str(e)}")

        yield _sse(
            {"new_articles": new_articles, "duplicates_skipped": duplicates_skipped, "errors": errors},
            event="done",
        )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/articles/refresh", response_model=RefreshResponse)
def refresh_articles(
    max_per_source: int = Query(5, ge=1, le=20, description="Kaynak başına max haber sayısı (1-20)"),
    db: Session = Depends(get_db)
):
    """
    Refresh articles from all active RSS sources.
    Prevents duplicate articles using content_hash.
    Analyzes articles with LLM and calculates BIOS-Fit score.
    """
    # Get all active sources
    sources = db.query(RSSSource).filter(RSSSource.is_active == True).all()
    
    sources_checked = 0
    new_articles = 0
    duplicates_skipped = 0
    errors = []
    
    for source in sources:
        sources_checked += 1
        
        try:
            # Fetch articles from source (limited by max_per_source)
            articles_data = fetch_articles_from_source(source, max_per_source=max_per_source)
            
            for article_data in articles_data:
                # Generate content hash
                content_hash = generate_content_hash(
                    article_data["title"],
                    article_data["link"]
                )
                
                # Check if article already exists
                existing = db.query(Article).filter(Article.content_hash == content_hash).first()
                if existing:
                    duplicates_skipped += 1
                    continue
                
                # 🤖 LLM Analysis
                try:
                    time.sleep(LLM_RATE_LIMIT_DELAY)
                    llm_result = analyze_article_with_llm(
                        article_data["title"],
                        article_data["raw_summary"] or ""
                    )
                    
                    # 📊 Score Calculation - Calculate BIOS-Fit score
                    scored_result = calculate_bios_fit_score(llm_result, source.url)
                    
                    # Create new article with LLM analysis and score
                    new_article = Article(
                        source_id=article_data["source_id"],
                        source_name=article_data["source_name"],
                        title=article_data["title"],
                        link=article_data["link"],
                        published_at=article_data["published_at"],
                        raw_summary=article_data["raw_summary"],
                        content_hash=content_hash,
                        # AI fields from LLM
                        event_type=scored_result.get("event_type", "other"),
                        summary_tr=scored_result.get("summary_tr", article_data["raw_summary"]),
                        company=scored_result.get("company"),
                        from_location=scored_result.get("from_location"),
                        to_location=scored_result.get("to_location"),
                        sector=scored_result.get("sector"),
                        timeline=scored_result.get("timeline"),
                        score=scored_result.get("score", 0),
                        confidence=scored_result.get("confidence", 0.0),
                        action_label=scored_result.get("action_label", "Düşük Alaka"),
                        color_label=scored_result.get("color_label", "gray")
                    )
                    
                    db.add(new_article)
                    new_articles += 1
                    
                except QuotaExhaustedError:
                    # Kota bitti — o ana kadar kaydedilenleri kaydet ve dur
                    db.commit()
                    raise HTTPException(
                        status_code=429,
                        detail=f"API kota limiti bitti. {new_articles} haber kaydedildi, işlem durduruldu."
                    )
                except Exception as llm_error:
                    # Diğer LLM hatalarında fallback ile kaydet, devam et
                    print(f"[WARN] LLM hatası: {article_data['title'][:50]}... Hata: {llm_error}")
                    new_article = Article(
                        source_id=article_data["source_id"],
                        source_name=article_data["source_name"],
                        title=article_data["title"],
                        link=article_data["link"],
                        published_at=article_data["published_at"],
                        raw_summary=article_data["raw_summary"],
                        content_hash=content_hash,
                        event_type="other",
                        summary_tr=article_data["raw_summary"] or "AI analiz bekliyor",
                        score=0,
                        confidence=0.0,
                        action_label="Düşük Alaka",
                        color_label="gray"
                    )
                    db.add(new_article)
                    new_articles += 1

            # Update last_fetched_at for source
            source.last_fetched_at = datetime.utcnow()

        except HTTPException:
            raise  # quota hatası yukarı geçsin
        except Exception as e:
            errors.append(f"{source.name}: {str(e)}")
            continue
    
    # Commit all changes
    db.commit()
    
    return RefreshResponse(
        message="Refresh completed with LLM analysis and scoring",
        sources_checked=sources_checked,
        new_articles=new_articles,
        duplicates_skipped=duplicates_skipped,
        errors=errors
    )


@router.get("/articles", response_model=ArticleListResponse)
def list_articles(
    search: Optional[str] = Query(None, description="Search in title, summary, company, sector"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    min_score: Optional[int] = Query(None, description="Minimum score filter"),
    source_id: Optional[int] = Query(None, description="Filter by source ID"),
    limit: int = Query(200, ge=1, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Session = Depends(get_db)
):
    """
    List articles with filtering and pagination.
    """
    # Build query
    query = db.query(Article)
    
    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Article.title.ilike(search_pattern),
                Article.raw_summary.ilike(search_pattern),
                Article.summary_tr.ilike(search_pattern),
                Article.company.ilike(search_pattern),
                Article.sector.ilike(search_pattern)
            )
        )
    
    if event_type:
        query = query.filter(Article.event_type == event_type)
    
    if min_score is not None:
        query = query.filter(Article.score >= min_score)
    
    if source_id:
        query = query.filter(Article.source_id == source_id)
    
    # Get total count
    total = query.count()
    
    # Apply ordering and pagination
    articles = query.order_by(
        Article.published_at.desc().nullslast(),
        Article.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    return ArticleListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=articles
    )


@router.delete("/articles", status_code=200)
def delete_all_articles(db: Session = Depends(get_db)):
    """
    Tüm haberleri ve ilgili notları siler.
    """
    deleted = db.query(Article).delete()
    db.commit()
    return {"message": f"{deleted} haber silindi"}


@router.delete("/articles/{article_id}", status_code=200)
def delete_article(article_id: int, db: Session = Depends(get_db)):
    """
    Tek bir haberi ve ona bağlı notları siler.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    deleted_notes = db.query(ArticleNote).filter(ArticleNote.article_id == article_id).delete()
    db.delete(article)
    db.commit()
    return {"message": f"Haber silindi", "deleted_notes": deleted_notes}


@router.patch("/articles/{article_id}", response_model=ArticleResponse)
def update_article(article_id: int, data: ArticleUpdateRequest, db: Session = Depends(get_db)):
    """
    Haberin AI alanlarını günceller ve skoru yeniden hesaplar.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(article, field, value or None)

    llm_data = {
        "event_type": article.event_type,
        "company": article.company,
        "from_location": article.from_location,
        "to_location": article.to_location,
        "sector": article.sector,
        "timeline": article.timeline,
    }
    source_url = article.source.url if article.source else ""
    scored = calculate_bios_fit_score(llm_data, source_url)

    article.score = scored["score"]
    article.confidence = scored["confidence"]
    article.action_label = scored["action_label"]
    article.color_label = scored["color_label"]

    db.commit()
    db.refresh(article)
    return article


@router.get("/articles/{article_id}/breakdown", response_model=ScoreBreakdownResponse)
def get_article_breakdown(article_id: int, db: Session = Depends(get_db)):
    """
    Bir haberin BIOS-Fit skor bileşenlerini döndürür.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ScoreBreakdownResponse(**compute_breakdown_from_article(article))


@router.get("/articles/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db)):
    """
    Get a single article by ID.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics.
    """
    stats = get_dashboard_stats(db)
    return StatsResponse(**stats)
