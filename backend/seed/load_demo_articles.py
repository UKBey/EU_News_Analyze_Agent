import json
import os
from sqlalchemy.orm import Session
from models import Article, RSSSource
from services.dedup_service import generate_content_hash
from datetime import datetime


def load_demo_articles(db: Session):
    """
    Load demo articles from JSON file for hackathon presentation.
    This is a fallback in case RSS sources don't have new articles during demo.
    """
    # Check if we already have articles
    existing_count = db.query(Article).count()
    if existing_count > 0:
        print(f"Database already has {existing_count} articles. Skipping demo load.")
        return
    
    # Get or create a demo source
    demo_source = db.query(RSSSource).filter(RSSSource.name == "Demo Source").first()
    if not demo_source:
        demo_source = RSSSource(
            name="Demo Source",
            url="https://demo.example.com/feed",
            category="demo",
            is_active=False  # Mark as inactive so it won't be refreshed
        )
        db.add(demo_source)
        db.commit()
        db.refresh(demo_source)
    
    # Load demo articles from JSON
    json_path = os.path.join(os.path.dirname(__file__), "demo_articles.json")
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            demo_articles = json.load(f)
        
        loaded_count = 0
        for article_data in demo_articles:
            # Generate content hash
            content_hash = generate_content_hash(
                article_data["title"],
                article_data["link"]
            )
            
            # Check if already exists
            existing = db.query(Article).filter(Article.content_hash == content_hash).first()
            if existing:
                continue
            
            # Parse published_at
            published_at = None
            if article_data.get("published_at"):
                try:
                    published_at = datetime.fromisoformat(article_data["published_at"].replace('Z', '+00:00'))
                except:
                    published_at = datetime.utcnow()
            
            # Create article
            article = Article(
                source_id=demo_source.id,
                source_name=article_data.get("source_name", "Demo Source"),
                title=article_data["title"],
                link=article_data["link"],
                published_at=published_at,
                raw_summary=article_data.get("raw_summary"),
                content_hash=content_hash,
                event_type=article_data.get("event_type", "other"),
                summary_tr=article_data.get("summary_tr"),
                company=article_data.get("company"),
                from_location=article_data.get("from_location"),
                to_location=article_data.get("to_location"),
                sector=article_data.get("sector"),
                score=article_data.get("score", 0),
                confidence=article_data.get("confidence", 0.0),
                action_label=article_data.get("action_label", "Düşük Alaka"),
                color_label=article_data.get("color_label", "gray")
            )
            
            db.add(article)
            loaded_count += 1
        
        db.commit()
        print(f"✅ Successfully loaded {loaded_count} demo articles for hackathon presentation.")
        
    except FileNotFoundError:
        print(f"❌ Demo articles JSON file not found at {json_path}")
    except Exception as e:
        print(f"❌ Error loading demo articles: {e}")
        db.rollback()


if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    try:
        load_demo_articles(db)
    finally:
        db.close()
