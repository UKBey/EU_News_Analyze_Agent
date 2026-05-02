from pydantic import BaseModel
from datetime import datetime


class NoteCreate(BaseModel):
    content: str
    user_id: str = "anonymous"


class NoteUpdate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: int
    article_id: int
    user_id: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
