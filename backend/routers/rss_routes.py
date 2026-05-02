from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import RSSSource
from schemas import RSSSourceCreate, RSSSourceResponse
from services import validate_rss_url

router = APIRouter(prefix="/api/rss-sources", tags=["RSS Sources"])


@router.post("", response_model=RSSSourceResponse, status_code=201)
def create_rss_source(source: RSSSourceCreate, db: Session = Depends(get_db)):
    """
    Create a new RSS source.
    Validates the RSS URL before saving.
    """
    # Check if URL already exists
    existing = db.query(RSSSource).filter(RSSSource.url == source.url).first()
    if existing:
        raise HTTPException(status_code=400, detail="RSS source with this URL already exists")
    
    # Validate RSS URL
    try:
        validate_rss_url(source.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Create new source
    db_source = RSSSource(
        name=source.name,
        url=source.url,
        category=source.category
    )
    
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    
    return db_source


@router.get("", response_model=List[RSSSourceResponse])
def list_rss_sources(db: Session = Depends(get_db)):
    """
    List all RSS sources ordered by created_at desc.
    """
    sources = db.query(RSSSource).order_by(RSSSource.created_at.desc()).all()
    return sources


@router.delete("/{source_id}", status_code=204)
def delete_rss_source(source_id: int, db: Session = Depends(get_db)):
    """
    Delete an RSS source by ID.
    Also deletes all related articles (cascade delete).
    """
    source = db.query(RSSSource).filter(RSSSource.id == source_id).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="RSS source not found")
    
    db.delete(source)
    db.commit()
    
    return None
