from sqlalchemy.orm import Session
from sqlalchemy import func
from models import RSSSource, Article
from typing import Dict, Any, Optional
from datetime import datetime


def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    """
    Get dashboard statistics including counts and distributions.
    """
    # Count total sources
    source_count = db.query(RSSSource).count()
    
    # Count total articles
    article_count = db.query(Article).count()
    
    # Count high score articles (score >= 70)
    high_score_count = db.query(Article).filter(Article.score >= 70).count()
    
    # Get event type distribution
    event_distribution = db.query(
        Article.event_type,
        func.count(Article.id).label('count')
    ).group_by(Article.event_type).all()
    
    event_type_distribution = {event_type: count for event_type, count in event_distribution}
    
    # Get last refresh time (most recent last_fetched_at from sources)
    last_refresh = db.query(func.max(RSSSource.last_fetched_at)).scalar()
    
    return {
        "source_count": source_count,
        "article_count": article_count,
        "high_score_count": high_score_count,
        "event_type_distribution": event_type_distribution,
        "last_refresh_at": last_refresh
    }
