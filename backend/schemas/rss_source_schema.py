from pydantic import BaseModel, HttpUrl, field_validator
from datetime import datetime
from typing import Optional


class RSSSourceCreate(BaseModel):
    name: str
    url: str
    category: Optional[str] = None

    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @field_validator('url')
    @classmethod
    def url_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('URL cannot be empty')
        return v.strip()


class RSSSourceResponse(BaseModel):
    id: int
    name: str
    url: str
    category: Optional[str]
    is_active: bool
    last_fetched_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
