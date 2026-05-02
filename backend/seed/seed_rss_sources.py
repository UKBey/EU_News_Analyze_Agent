"""
Seed RSS sources from scoring/rss_links.txt
"""
from sqlalchemy.orm import Session
from models import RSSSource
import os


RSS_SOURCES = [
    {
        "name": "EU Startups",
        "url": "https://www.eu-startups.com/feed/",
        "category": "startups"
    },
    {
        "name": "EU Business News",
        "url": "https://eubusinessnews.com/feed",
        "category": "business"
    },
    {
        "name": "ECSB Research Blog",
        "url": "https://ecsbresearchblog.wordpress.com/feed/",
        "category": "research"
    },
    {
        "name": "The European",
        "url": "https://the-european.eu/feed",
        "category": "news"
    },
    {
        "name": "European Business Magazine",
        "url": "https://europeanbusinessmagazine.com/feed/",
        "category": "business"
    },
    {
        "name": "European Business Review",
        "url": "https://www.europeanbusinessreview.com/feed/",
        "category": "business"
    },
    {
        "name": "Entrepreneur",
        "url": "https://www.entrepreneur.com/rss-feed/latest",
        "category": "business"
    },
    {
        "name": "Fast Company",
        "url": "https://www.fastcompany.com/latest/rss?truncated=true",
        "category": "business"
    },
    {
        "name": "Small Business Trends",
        "url": "https://feeds.feedburner.com/SmallBusinessTrends/?feedId=220&uuid=JHEFJFpFDDIDMFLEDIDEFpFDMBEKEBHDBEDD",
        "category": "business"
    },
    {
        "name": "Inc. Magazine",
        "url": "https://www.inc.com/rss/",
        "category": "business"
    },
    {
        "name": "TechCrunch",
        "url": "https://techcrunch.com/feed/",
        "category": "technology"
    },
    {
        "name": "VentureBeat",
        "url": "https://feeds.feedburner.com/venturebeat/SZYF",
        "category": "technology"
    }
]


def seed_rss_sources(db: Session, force: bool = False):
    """
    Seed RSS sources from the predefined list.
    
    Args:
        db: Database session
        force: If True, add sources even if some already exist
    """
    # Check if sources already exist
    existing_count = db.query(RSSSource).count()
    
    if existing_count > 0 and not force:
        print(f"[INFO] Database already has {existing_count} RSS sources.")
        print("   Run with force=True to add more sources anyway.")
        return
    
    added_count = 0
    skipped_count = 0
    
    for source_data in RSS_SOURCES:
        # Check if URL already exists
        existing = db.query(RSSSource).filter(RSSSource.url == source_data["url"]).first()
        
        if existing:
            print(f"[SKIP] Skipped: {source_data['name']} (already exists)")
            skipped_count += 1
            continue
        
        # Create new source
        source = RSSSource(
            name=source_data["name"],
            url=source_data["url"],
            category=source_data.get("category"),
            is_active=True
        )
        
        db.add(source)
        added_count += 1
        print(f"[OK] Added: {source_data['name']}")
    
    db.commit()
    
    print(f"\n[SUMMARY]")
    print(f"   Added: {added_count}")
    print(f"   Skipped: {skipped_count}")
    print(f"   Total in DB: {db.query(RSSSource).count()}")
    
    if added_count > 0:
        print(f"\n[OK] Successfully seeded {added_count} RSS sources!")
        print(f"   Now you can refresh articles from the frontend or API.")


if __name__ == "__main__":
    from database import SessionLocal
    
    print("[SEED] Seeding RSS sources from scoring/rss_links.txt...")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        seed_rss_sources(db, force=False)
    finally:
        db.close()
    
    print("=" * 60)
    print("[OK] Done!")
