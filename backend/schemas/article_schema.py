from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict


class ArticleResponse(BaseModel):
    id: int
    source_id: int
    source_name: str
    title: str
    link: str
    published_at: Optional[datetime]
    raw_summary: Optional[str]
    event_type: str
    summary_tr: Optional[str]
    company: Optional[str]
    from_location: Optional[str]
    to_location: Optional[str]
    sector: Optional[str]
    score: int
    confidence: float
    action_label: Optional[str]
    color_label: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[ArticleResponse]


class RefreshResponse(BaseModel):
    message: str
    sources_checked: int
    new_articles: int
    duplicates_skipped: int
    errors: List[str]


class StatsResponse(BaseModel):
    source_count: int
    article_count: int
    high_score_count: int
    event_type_distribution: Dict[str, int]
    last_refresh_at: Optional[datetime]
