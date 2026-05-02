import feedparser
import httpx
from typing import List, Dict, Any
from datetime import datetime
import time


def validate_rss_url(url: str) -> bool:
    """
    Validate that the URL is a valid RSS feed.
    Returns True if valid, raises ValueError if invalid.
    """
    try:
        # Try to fetch and parse the RSS feed
        feed = feedparser.parse(url)
        
        # Check if feed has entries or at least basic feed info
        if feed.bozo and not feed.entries:
            # bozo=1 means there was a parsing error
            raise ValueError(f"Invalid RSS feed: {feed.get('bozo_exception', 'Unknown error')}")
        
        # Check if feed has basic structure
        if not hasattr(feed, 'feed') and not feed.entries:
            raise ValueError("URL does not appear to be a valid RSS feed")
        
        return True
    except Exception as e:
        raise ValueError(f"Failed to validate RSS URL: {str(e)}")


def fetch_articles_from_source(source) -> List[Dict[str, Any]]:
    """
    Fetch articles from a single RSS source.
    Returns a list of article dictionaries.
    """
    try:
        feed = feedparser.parse(source.url)
        
        articles = []
        for entry in feed.entries:
            # Extract published date
            published_at = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_at = datetime.fromtimestamp(time.mktime(entry.published_parsed))
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                published_at = datetime.fromtimestamp(time.mktime(entry.updated_parsed))
            
            # Extract summary
            summary = ""
            if hasattr(entry, 'summary'):
                summary = entry.summary
            elif hasattr(entry, 'description'):
                summary = entry.description
            
            article_data = {
                "title": entry.get("title", "No title"),
                "link": entry.get("link", ""),
                "published_at": published_at,
                "raw_summary": summary,
                "source_id": source.id,
                "source_name": source.name,
            }
            
            articles.append(article_data)
        
        return articles
    
    except Exception as e:
        raise Exception(f"Failed to fetch articles from {source.name}: {str(e)}")
