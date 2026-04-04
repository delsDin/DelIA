"""
Schémas Pydantic pour la validation des requêtes/réponses de l'API.
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MessageCreate(BaseModel):
    """Schéma pour créer un message."""
    role: str
    content: str
    model: Optional[str] = None
    system_prompt: Optional[str] = None


class Message(MessageCreate):
    """Schéma pour un message complet."""
    id: int
    discussion_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DiscussionCreate(BaseModel):
    """Schéma pour créer une discussion."""
    title: str
    description: Optional[str] = None


class DiscussionUpdate(BaseModel):
    """Schéma pour mettre à jour une discussion."""
    title: Optional[str] = None
    description: Optional[str] = None


class DiscussionDetail(BaseModel):
    """Schéma pour une discussion avec tous les messages."""
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []

    class Config:
        from_attributes = True


class DiscussionSummary(BaseModel):
    """Schéma pour un résumé de discussion (sans messages)."""
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """Schéma pour une requête de chat avec stockage en BD."""
    prompt: str
    model: str = 'Llama 3.2 3B'
    systemPrompt: str = ''
    history: Optional[List[dict]] = None
    discussion_id: Optional[int] = None  # ID de la discussion pour stocker le message
