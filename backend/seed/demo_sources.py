from sqlalchemy.orm import Session
from models import RSSSource


def seed_demo_sources(db: Session):
    """
    Seed demo RSS sources if database is empty.
    """
    # Check if sources already exist
    existing_count = db.query(RSSSource).count()
    if existing_count > 0:
        print(f"Database already has {existing_count} sources. Skipping seed.")
        return
    
    demo_sources = [
        {
            "name": "TechCrunch",
            "url": "https://techcrunch.com/feed/",
            "category": "technology"
        },
        {
            "name": "Reuters Business",
            "url": "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
            "category": "business"
        },
        {
            "name": "BBC News - Business",
            "url": "http://feeds.bbci.co.uk/news/business/rss.xml",
            "category": "business"
        },
        {
            "name": "The Verge",
            "url": "https://www.theverge.com/rss/index.xml",
            "category": "technology"
        },
        {
            "name": "Ars Technica",
            "url": "https://feeds.arstechnica.com/arstechnica/index",
            "category": "technology"
        }
    ]
    
    for source_data in demo_sources:
        source = RSSSource(**source_data)
        db.add(source)
    
    db.commit()
    print(f"Successfully seeded {len(demo_sources)} demo RSS sources.")
