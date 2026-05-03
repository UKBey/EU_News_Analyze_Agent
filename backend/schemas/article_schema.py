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
    timeline: Optional[str]
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
    today_count: int = 0
    week_count: int = 0
    top_company: Optional[str] = None
    top_country: Optional[str] = None
    top_source: Optional[str] = None
    avg_score: Optional[float] = None


class ScoreBreakdownResponse(BaseModel):
    event_type_score: float
    actor_clarity_score: float
    geography_score: float
    time_window_score: float
    source_trust_score: float
    contribution_E: int
    contribution_A: int
    contribution_G: int
    contribution_T: int
    contribution_C: int
    max_E: int = 30
    max_A: int = 25
    max_G: int = 20
    max_T: int = 15
    max_C: int = 10


class ArticleUpdateRequest(BaseModel):
    event_type: Optional[str] = None
    company: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    sector: Optional[str] = None
    timeline: Optional[str] = None
