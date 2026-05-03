from sqlalchemy.orm import Session
from sqlalchemy import func
from models import RSSSource, Article
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

LOCAL_TIME_OFFSET = timedelta(hours=3)


def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    source_count = db.query(RSSSource).count()
    article_count = db.query(Article).count()
    high_score_count = db.query(Article).filter(Article.score >= 70).count()

    event_distribution = db.query(
        Article.event_type,
        func.count(Article.id).label("count")
    ).group_by(Article.event_type).all()
    event_type_distribution = {et: cnt for et, cnt in event_distribution}

    last_refresh = db.query(func.max(RSSSource.last_fetched_at)).scalar()

    # Today and this-week counts use local midnight (UTC+3) instead of raw UTC midnight.
    local_now = datetime.utcnow() + LOCAL_TIME_OFFSET
    local_today_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    local_week_start = local_today_start - timedelta(days=6)

    today_start_utc = local_today_start - LOCAL_TIME_OFFSET
    week_start_utc = local_week_start - LOCAL_TIME_OFFSET

    today_count = db.query(Article).filter(Article.created_at >= today_start_utc).count()
    week_count = db.query(Article).filter(Article.created_at >= week_start_utc).count()

    # Top company (most articles, excluding nulls and "Bilinmiyor")
    top_company_row = (
        db.query(Article.company, func.count(Article.id).label("cnt"))
        .filter(Article.company.isnot(None), Article.company != "", Article.company != "Bilinmiyor")
        .group_by(Article.company)
        .order_by(func.count(Article.id).desc())
        .first()
    )
    top_company: Optional[str] = top_company_row[0] if top_company_row else None

    # Top source by article count
    top_source_row = (
        db.query(Article.source_name, func.count(Article.id).label("cnt"))
        .group_by(Article.source_name)
        .order_by(func.count(Article.id).desc())
        .first()
    )
    top_source: Optional[str] = top_source_row[0] if top_source_row else None

    # Top country — extract from from_location / to_location (take part after last comma)
    # Exclude nulls, empty strings, and LLM-generated "null" string values
    _loc_filter = lambda col: (
        col.isnot(None),
        col != "",
        col != "null",
        col != "None",
    )
    country_counts: Dict[str, int] = {}
    for (loc,) in db.query(Article.from_location).filter(*_loc_filter(Article.from_location)).all():
        country = loc.rsplit(",", 1)[-1].strip()
        if country and country.lower() not in ("null", "none", ""):
            country_counts[country] = country_counts.get(country, 0) + 1
    for (loc,) in db.query(Article.to_location).filter(*_loc_filter(Article.to_location)).all():
        country = loc.rsplit(",", 1)[-1].strip()
        if country and country.lower() not in ("null", "none", ""):
            country_counts[country] = country_counts.get(country, 0) + 1
    top_country: Optional[str] = max(country_counts, key=country_counts.get) if country_counts else None

    # Average score
    avg_score_val = db.query(func.avg(Article.score)).scalar()
    avg_score: Optional[float] = round(float(avg_score_val), 1) if avg_score_val is not None else None

    return {
        "source_count": source_count,
        "article_count": article_count,
        "high_score_count": high_score_count,
        "event_type_distribution": event_type_distribution,
        "last_refresh_at": last_refresh,
        "today_count": today_count,
        "week_count": week_count,
        "top_company": top_company,
        "top_country": top_country,
        "top_source": top_source,
        "avg_score": avg_score,
    }
