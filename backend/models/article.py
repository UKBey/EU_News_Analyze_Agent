from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("rss_sources.id", ondelete="CASCADE"), nullable=False)
    source_name = Column(String, nullable=False)
    
    # Core article fields
    title = Column(String, nullable=False)
    link = Column(String, nullable=False)
    published_at = Column(DateTime, nullable=True)
    raw_summary = Column(Text, nullable=True)
    content_hash = Column(String, nullable=False, unique=True, index=True)
    
    # AI-related fields (to be filled by AI teammate later)
    event_type = Column(String, default="other", nullable=False, index=True)
    summary_tr = Column(Text, nullable=True)
    company = Column(String, nullable=True)
    from_location = Column(String, nullable=True)
    to_location = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    score = Column(Integer, default=0, nullable=False, index=True)
    confidence = Column(Float, default=0.0, nullable=False)
    action_label = Column(String, nullable=True)
    color_label = Column(String, nullable=True)
    timeline = Column(String, nullable=True)  # "0-6m" | "6-18m" | "18-36m" | null
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to RSS source
    source = relationship("RSSSource", back_populates="articles")

    # Additional indexes for performance
    __table_args__ = (
        Index('idx_published_at', 'published_at'),
        Index('idx_event_type', 'event_type'),
        Index('idx_score', 'score'),
    )
