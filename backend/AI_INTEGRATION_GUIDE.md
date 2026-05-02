# AI Integration Guide for AI/RSS Teammate

## Overview

This guide explains how to integrate AI/LLM analysis with the backend to enrich articles with intelligent classification and scoring.

## Current State

Articles are stored with **default AI field values** after being fetched from RSS sources:

```python
{
    "event_type": "other",
    "summary_tr": raw_summary or "AI analysis pending",
    "company": None,
    "from_location": None,
    "to_location": None,
    "sector": None,
    "score": 0,
    "confidence": 0.0,
    "action_label": "Düşük Alaka",
    "color_label": "gray"
}
```

## Your Task

Process articles with LLM to extract:
1. **Event Type Classification**: What type of industrial event is this?
2. **Turkish Summary**: Translate/summarize in Turkish
3. **Entity Extraction**: Company name, locations, sector
4. **Relevance Scoring**: How relevant is this for industrial investment opportunities?

---

## Database Access

### Setup

```python
from database import SessionLocal
from models import Article, RSSSource

# Create database session
db = SessionLocal()

try:
    # Your code here
    pass
finally:
    db.close()
```

### Get Articles Needing Analysis

```python
# Get all articles with default AI values (not yet analyzed)
unprocessed_articles = db.query(Article).filter(
    Article.event_type == "other",
    Article.score == 0
).all()

print(f"Found {len(unprocessed_articles)} articles to process")
```

### Get Specific Article

```python
article = db.query(Article).filter(Article.id == 1).first()

if article:
    print(f"Title: {article.title}")
    print(f"Summary: {article.raw_summary}")
    print(f"Link: {article.link}")
```

---

## Update AI Fields

### Single Article Update

```python
from database import SessionLocal
from models import Article

db = SessionLocal()

try:
    # Get article
    article = db.query(Article).filter(Article.id == 1).first()
    
    if article:
        # Update AI fields after LLM analysis
        article.event_type = "expansion"
        article.summary_tr = "Tesla, Berlin'de yeni üretim tesisini açtı. 12,000 kişiye istihdam sağlayacak."
        article.company = "Tesla"
        article.from_location = None
        article.to_location = "Berlin, Germany"
        article.sector = "Automotive"
        article.score = 85
        article.confidence = 0.92
        article.action_label = "Yüksek Fırsat"
        article.color_label = "green"
        
        db.commit()
        print(f"Updated article {article.id}")
    
finally:
    db.close()
```

### Batch Update

```python
from database import SessionLocal
from models import Article

def update_article_with_ai(article_id, ai_results):
    """
    Update a single article with AI analysis results.
    """
    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            return False
        
        article.event_type = ai_results.get("event_type", "other")
        article.summary_tr = ai_results.get("summary_tr")
        article.company = ai_results.get("company")
        article.from_location = ai_results.get("from_location")
        article.to_location = ai_results.get("to_location")
        article.sector = ai_results.get("sector")
        article.score = ai_results.get("score", 0)
        article.confidence = ai_results.get("confidence", 0.0)
        article.action_label = ai_results.get("action_label")
        article.color_label = ai_results.get("color_label")
        
        db.commit()
        return True
    finally:
        db.close()

# Process multiple articles
unprocessed = get_unprocessed_articles()

for article in unprocessed:
    # Run your LLM analysis
    ai_results = analyze_with_llm(article.title, article.raw_summary)
    
    # Update database
    update_article_with_ai(article.id, ai_results)
```

---

## AI Field Specifications

### 1. event_type (string, required)

**Valid values:**
- `"relocation"` - Company moving facilities
- `"closure"` - Factory/office closing
- `"expansion"` - Business expansion, new investment
- `"new_plant"` - New facility opening
- `"tender"` - Government/corporate tender announcement
- `"other"` - Other news

**Example LLM Prompt:**
```
Classify this news article into one of these categories:
- relocation: Company relocating facilities
- closure: Factory or office closure
- expansion: Business expansion or growth
- new_plant: New facility opening
- tender: Tender announcement
- other: Other news

Article: {title}
Summary: {raw_summary}

Return only the category name.
```

### 2. summary_tr (text, nullable)

Turkish summary of the article (2-3 sentences).

**Example LLM Prompt:**
```
Summarize this article in Turkish (2-3 sentences):

Title: {title}
Content: {raw_summary}

Focus on: company name, location, investment amount, job creation.
```

### 3. company (string, nullable)

Main company mentioned in the article.

**Examples:**
- "Tesla"
- "Volkswagen"
- "Siemens"
- "BASF"

### 4. from_location (string, nullable)

Origin location (for relocations).

**Examples:**
- "Munich, Germany"
- "Detroit, USA"
- null (if not applicable)

### 5. to_location (string, nullable)

Destination location (for relocations, expansions, new plants).

**Examples:**
- "Berlin, Germany"
- "Istanbul, Turkey"
- "Shanghai, China"

### 6. sector (string, nullable)

Industry sector.

**Examples:**
- "Automotive"
- "Electronics"
- "Chemicals"
- "Energy"
- "Manufacturing"
- "Logistics"

### 7. score (integer, required, 0-100)

Relevance score for industrial investment opportunities.

**Scoring Guidelines:**
- **0-30**: Low relevance (general news, minor updates)
- **31-69**: Medium relevance (moderate investment, regional impact)
- **70-100**: High relevance (major investment, significant job creation, strategic importance)

**Factors to consider:**
- Investment amount
- Job creation numbers
- Strategic importance
- Geographic relevance (Europe focus)
- Industry sector importance

### 8. confidence (float, required, 0.0-1.0)

LLM confidence in the classification.

**Examples:**
- `0.95` - Very confident
- `0.75` - Moderately confident
- `0.50` - Low confidence

### 9. action_label (string, nullable)

Action recommendation in Turkish.

**Based on score:**
- Score 0-30: `"Düşük Alaka"` (Low relevance)
- Score 31-69: `"Orta Fırsat"` (Medium opportunity)
- Score 70-100: `"Yüksek Fırsat"` (High opportunity)

### 10. color_label (string, nullable)

UI color indicator.

**Based on score:**
- Score 0-30: `"gray"`
- Score 31-69: `"yellow"`
- Score 70-100: `"green"`

---

## Complete LLM Integration Example

```python
import openai
from database import SessionLocal
from models import Article
import json

def analyze_article_with_llm(article):
    """
    Analyze article using OpenAI GPT.
    """
    prompt = f"""
    Analyze this industrial news article and extract structured information.
    
    Title: {article.title}
    Summary: {article.raw_summary}
    Link: {article.link}
    
    Extract:
    1. event_type: One of [relocation, closure, expansion, new_plant, tender, other]
    2. summary_tr: Turkish summary (2-3 sentences)
    3. company: Main company name
    4. from_location: Origin location (if applicable)
    5. to_location: Destination location (if applicable)
    6. sector: Industry sector
    7. score: Relevance score 0-100 (consider investment size, jobs, strategic importance)
    8. confidence: Your confidence 0.0-1.0
    
    Return JSON only.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an industrial news analyst."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    
    result = json.loads(response.choices[0].message.content)
    
    # Add action_label and color_label based on score
    score = result.get("score", 0)
    if score >= 70:
        result["action_label"] = "Yüksek Fırsat"
        result["color_label"] = "green"
    elif score >= 31:
        result["action_label"] = "Orta Fırsat"
        result["color_label"] = "yellow"
    else:
        result["action_label"] = "Düşük Alaka"
        result["color_label"] = "gray"
    
    return result


def process_all_unprocessed_articles():
    """
    Process all articles that haven't been analyzed yet.
    """
    db = SessionLocal()
    
    try:
        # Get unprocessed articles
        articles = db.query(Article).filter(
            Article.event_type == "other",
            Article.score == 0
        ).all()
        
        print(f"Processing {len(articles)} articles...")
        
        for i, article in enumerate(articles, 1):
            try:
                print(f"[{i}/{len(articles)}] Processing: {article.title[:50]}...")
                
                # Analyze with LLM
                ai_results = analyze_article_with_llm(article)
                
                # Update article
                article.event_type = ai_results.get("event_type", "other")
                article.summary_tr = ai_results.get("summary_tr")
                article.company = ai_results.get("company")
                article.from_location = ai_results.get("from_location")
                article.to_location = ai_results.get("to_location")
                article.sector = ai_results.get("sector")
                article.score = ai_results.get("score", 0)
                article.confidence = ai_results.get("confidence", 0.0)
                article.action_label = ai_results.get("action_label")
                article.color_label = ai_results.get("color_label")
                
                db.commit()
                print(f"  ✓ Updated: {article.event_type}, score={article.score}")
                
            except Exception as e:
                print(f"  ✗ Error: {str(e)}")
                db.rollback()
                continue
        
        print("Processing complete!")
        
    finally:
        db.close()


if __name__ == "__main__":
    process_all_unprocessed_articles()
```

---

## Alternative: Using Local LLM (Ollama)

```python
import requests
import json

def analyze_with_ollama(article):
    """
    Analyze article using local Ollama LLM.
    """
    prompt = f"""
    Analyze this news article and return JSON with these fields:
    - event_type: [relocation, closure, expansion, new_plant, tender, other]
    - summary_tr: Turkish summary
    - company: Company name
    - to_location: Location
    - sector: Industry sector
    - score: 0-100
    - confidence: 0.0-1.0
    
    Article: {article.title}
    Summary: {article.raw_summary}
    """
    
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama2",
            "prompt": prompt,
            "stream": False
        }
    )
    
    result = json.loads(response.json()["response"])
    
    # Add labels based on score
    score = result.get("score", 0)
    if score >= 70:
        result["action_label"] = "Yüksek Fırsat"
        result["color_label"] = "green"
    elif score >= 31:
        result["action_label"] = "Orta Fırsat"
        result["color_label"] = "yellow"
    else:
        result["action_label"] = "Düşük Alaka"
        result["color_label"] = "gray"
    
    return result
```

---

## Scheduled Processing

### Option 1: Simple Loop

```python
import time

def continuous_processing(interval_seconds=300):
    """
    Process new articles every N seconds.
    """
    while True:
        print("Checking for new articles...")
        process_all_unprocessed_articles()
        print(f"Sleeping for {interval_seconds} seconds...")
        time.sleep(interval_seconds)

if __name__ == "__main__":
    continuous_processing(interval_seconds=300)  # Every 5 minutes
```

### Option 2: APScheduler

```python
from apscheduler.schedulers.blocking import BlockingScheduler

scheduler = BlockingScheduler()

@scheduler.scheduled_job('interval', minutes=5)
def scheduled_processing():
    print("Running scheduled article processing...")
    process_all_unprocessed_articles()

if __name__ == "__main__":
    print("Starting scheduler...")
    scheduler.start()
```

---

## Testing Your Integration

### 1. Create Test Article

```python
from database import SessionLocal
from models import Article, RSSSource
from services import generate_content_hash

db = SessionLocal()

# Get a source
source = db.query(RSSSource).first()

# Create test article
test_article = Article(
    source_id=source.id,
    source_name=source.name,
    title="Tesla opens new Gigafactory in Berlin",
    link="https://example.com/test",
    raw_summary="Tesla has opened a new manufacturing facility in Berlin, creating 12,000 jobs.",
    content_hash=generate_content_hash("Tesla opens new Gigafactory in Berlin", "https://example.com/test"),
    event_type="other",
    score=0
)

db.add(test_article)
db.commit()

print(f"Created test article with ID: {test_article.id}")
db.close()
```

### 2. Process Test Article

```python
# Run your LLM analysis on the test article
ai_results = analyze_article_with_llm(test_article)
print(json.dumps(ai_results, indent=2))
```

### 3. Verify in Database

```python
db = SessionLocal()
article = db.query(Article).filter(Article.id == test_article.id).first()

print(f"Event Type: {article.event_type}")
print(f"Company: {article.company}")
print(f"Score: {article.score}")
print(f"Summary TR: {article.summary_tr}")

db.close()
```

### 4. Check in API

```bash
curl http://localhost:8000/api/articles/1
```

---

## Performance Tips

1. **Batch Processing**: Process articles in batches to avoid overwhelming the LLM API
2. **Caching**: Cache LLM responses for similar articles
3. **Rate Limiting**: Respect API rate limits (OpenAI, etc.)
4. **Error Handling**: Handle LLM failures gracefully, keep default values
5. **Logging**: Log all processing for debugging

---

## Monitoring

### Check Processing Status

```python
from database import SessionLocal
from models import Article
from sqlalchemy import func

db = SessionLocal()

total = db.query(Article).count()
processed = db.query(Article).filter(Article.event_type != "other").count()
unprocessed = total - processed

print(f"Total articles: {total}")
print(f"Processed: {processed}")
print(f"Unprocessed: {unprocessed}")
print(f"Progress: {(processed/total*100):.1f}%")

db.close()
```

### Check Score Distribution

```python
from sqlalchemy import func

score_ranges = db.query(
    func.count(Article.id).label('count'),
    func.avg(Article.score).label('avg_score')
).filter(Article.score > 0).first()

print(f"Articles with scores: {score_ranges.count}")
print(f"Average score: {score_ranges.avg_score:.1f}")
```

---

## Integration Checklist

- [ ] Set up database connection
- [ ] Test reading articles from database
- [ ] Implement LLM analysis function
- [ ] Test with single article
- [ ] Implement batch processing
- [ ] Add error handling
- [ ] Test score/label assignment logic
- [ ] Verify updates in API
- [ ] Set up scheduled processing (optional)
- [ ] Add monitoring/logging

---

## Questions?

Check the main README.md or contact the backend developer.

Happy analyzing! 🤖
