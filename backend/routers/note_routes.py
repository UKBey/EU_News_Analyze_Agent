from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models.article_note import ArticleNote
from models import Article
from schemas.note_schema import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter(prefix="/api", tags=["Notes"])


@router.get("/articles/{article_id}/notes", response_model=List[NoteResponse])
def get_notes(
    article_id: int,
    user_id: str = Query("anonymous"),
    db: Session = Depends(get_db),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return (
        db.query(ArticleNote)
        .filter(ArticleNote.article_id == article_id, ArticleNote.user_id == user_id)
        .order_by(ArticleNote.created_at.desc())
        .all()
    )


@router.post("/articles/{article_id}/notes", response_model=NoteResponse)
def create_note(
    article_id: int,
    payload: NoteCreate,
    db: Session = Depends(get_db),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    note = ArticleNote(
        article_id=article_id,
        user_id=payload.user_id,
        content=payload.content,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
):
    note = db.query(ArticleNote).filter(ArticleNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.content = payload.content
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(ArticleNote).filter(ArticleNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
