from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import ollama
from typing import List, Optional
from database import engine, Base, get_db, Discussion, Message
from schemas import (
    ChatRequest, DiscussionCreate, DiscussionUpdate, DiscussionDetail,
    DiscussionSummary, MessageCreate
)

# Créer les tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

DEFAULT_SYSTEM_PROMPT = (
    "Tu es un assistant utile et clair. "
    "Quand tu présentes une liste ou plusieurs éléments, "
    "utilise impérativement des listes à puces (par exemple '-' ou '*') ou des listes numérotées. "
    "Ne te contente pas de simples retours à la ligne sans puce. "
    "Réponds toujours dans ce format structuré lorsqu'il y a plusieurs éléments."
)

# Autoriser ton interface React (généralement sur le port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapping des noms de modèles affichés aux noms Ollama
MODEL_MAPPING = {
    'Llama 3.2 3B': 'llama3.2:3b',
    'Llama 3.2 1B': 'llama3.2:1b',
    'Gemma 2 2B': 'gemma2:2b',
    'Qwen 2.5 1.5B': 'qwen2.5-coder:1.5b',
    'Qwen 2.5 7B': 'qwen2.5-coder:7b'
}

@app.get("/models")
async def get_models():
    """Retourne la liste des modèles disponibles"""
    return {"models": list(MODEL_MAPPING.keys())}


# ==================== Endpoints pour les Discussions ====================

@app.post("/discussions", response_model=DiscussionDetail)
async def create_discussion(
    discussion: DiscussionCreate,
    db: Session = Depends(get_db)
):
    """Crée une nouvelle discussion."""
    db_discussion = Discussion(
        title=discussion.title,
        description=discussion.description
    )
    db.add(db_discussion)
    db.commit()
    db.refresh(db_discussion)
    return db_discussion


@app.get("/discussions", response_model=List[DiscussionSummary])
async def list_discussions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Récupère la liste des discussions."""
    discussions = db.query(Discussion).offset(skip).limit(limit).all()
    result = []
    for disc in discussions:
        result.append({
            "id": disc.id,
            "title": disc.title,
            "description": disc.description,
            "created_at": disc.created_at,
            "updated_at": disc.updated_at,
            "message_count": len(disc.messages)
        })
    return result


@app.get("/discussions/{discussion_id}", response_model=DiscussionDetail)
async def get_discussion(
    discussion_id: int,
    db: Session = Depends(get_db)
):
    """Récupère une discussion avec tous ses messages."""
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion non trouvée")
    return discussion


@app.put("/discussions/{discussion_id}", response_model=DiscussionDetail)
async def update_discussion(
    discussion_id: int,
    discussion: DiscussionUpdate,
    db: Session = Depends(get_db)
):
    """Met à jour une discussion."""
    db_discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not db_discussion:
        raise HTTPException(status_code=404, detail="Discussion non trouvée")
    
    if discussion.title is not None:
        db_discussion.title = discussion.title
    if discussion.description is not None:
        db_discussion.description = discussion.description
    
    db.commit()
    db.refresh(db_discussion)
    return db_discussion


@app.delete("/discussions/{discussion_id}")
async def delete_discussion(
    discussion_id: int,
    db: Session = Depends(get_db)
):
    """Supprime une discussion et tous ses messages."""
    db_discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not db_discussion:
        raise HTTPException(status_code=404, detail="Discussion non trouvée")
    
    db.delete(db_discussion)
    db.commit()
    return {"message": "Discussion supprimée avec succès"}


# ==================== Endpoint Chat avec Stockage ====================

import asyncio

@app.post("/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Chat avec le modèle spécifié. Sauvegarde en base de données."""
    
    # Créer ou récupérer la discussion
    discussion_id = request.discussion_id
    if not discussion_id:
        # Créer une nouvelle discussion automatiquement
        new_discussion = Discussion(
            title="Discussion sans titre",
            description=None
        )
        db.add(new_discussion)
        db.commit()
        db.refresh(new_discussion)
        discussion_id = new_discussion.id
    else:
        # Vérifier que la discussion existe
        discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion non trouvée")
    
    # Sauvegarder le message utilisateur
    user_message = Message(
        discussion_id=discussion_id,
        role="user",
        content=request.prompt,
        model=None,
        system_prompt=None
    )
    db.add(user_message)
    db.commit()
    
    # Préparer les messages pour Ollama
    ollama_model = MODEL_MAPPING.get(request.model, 'llama3.2:3b')
    messages = []

    messages.append({'role': 'system', 'content': DEFAULT_SYSTEM_PROMPT})
    if request.systemPrompt and request.systemPrompt.strip():
        messages.append({
            'role': 'system',
            'content': request.systemPrompt
        })

    if request.history:
        mapped_history = []
        for item in request.history:
            role = item.get('role')
            if role == 'model':
                mapped_history.append({'role': 'assistant', 'content': item.get('content', '')})
            else:
                mapped_history.append({'role': role or 'user', 'content': item.get('content', '')})
        messages.extend(mapped_history)
    else:
        messages.append({'role': 'user', 'content': request.prompt})

    # Appeler Ollama
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: ollama.chat(model=ollama_model, messages=messages)
    )
    
    response_text = response['message']['content']
    
    # Sauvegarder le message du modèle
    assistant_message = Message(
        discussion_id=discussion_id,
        role="assistant",
        content=response_text,
        model=request.model,
        system_prompt=request.systemPrompt if request.systemPrompt else None
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    
    # Mettre à jour le titre de la discussion si c'est le premier message
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if discussion and discussion.title == "Discussion sans titre":
        # Utiliser le début du premier message comme titre
        title_preview = request.prompt[:50].replace('\n', ' ')
        discussion.title = title_preview + ("..." if len(request.prompt) > 50 else "")
        db.commit()

    return {
        "response": response_text,
        "discussion_id": discussion_id,
        "message_id": assistant_message.id
    }


# ==================== Endpoints pour les Messages ====================

@app.get("/discussions/{discussion_id}/messages")
async def get_messages(
    discussion_id: int,
    db: Session = Depends(get_db)
):
    """Récupère tous les messages d'une discussion."""
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion non trouvée")
    
    messages = db.query(Message).filter(Message.discussion_id == discussion_id).order_by(Message.created_at).all()
    return messages


@app.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    """Supprime un message spécifique."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    db.delete(message)
    db.commit()
    return {"message": "Message supprimé avec succès"}


@app.get("/discussions/{discussion_id}/export")
async def export_discussion(
    discussion_id: int,
    db: Session = Depends(get_db)
):
    """Exporte une discussion au format JSON."""
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion non trouvée")
    
    messages = db.query(Message).filter(Message.discussion_id == discussion_id).order_by(Message.created_at).all()
    
    return {
        "id": discussion.id,
        "title": discussion.title,
        "description": discussion.description,
        "created_at": discussion.created_at,
        "updated_at": discussion.updated_at,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "model": msg.model,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)