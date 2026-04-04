"""
Configuration et modèles de la base de données pour l'historique des messages et discussions.
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chat_history.db")

# Créer l'engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Créer la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()


class Discussion(Base):
    """Modèle pour une discussion/conversation."""
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relation avec les messages
    messages = relationship("Message", back_populates="discussion", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Discussion(id={self.id}, title='{self.title}')>"


class Message(Base):
    """Modèle pour un message individuel dans une discussion."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user' ou 'assistant'
    content = Column(Text, nullable=False)
    model = Column(String(100), nullable=True)  # Modèle utilisé si role='assistant'
    system_prompt = Column(Text, nullable=True)  # Prompt système utilisé
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relation avec la discussion
    discussion = relationship("Discussion", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, role='{self.role}', discussion_id={self.discussion_id})>"


# Créer toutes les tables
Base.metadata.create_all(bind=engine)


def get_db():
    """Dépendance pour obtenir la session de base de données."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
