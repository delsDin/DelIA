"""
Utilitaires et helpers pour interagir avec la base de données via l'API.
"""

from typing import List, Optional, Dict
import httpx
import asyncio

BASE_URL = "http://localhost:8000"


class DiscussionClient:
    """Client pour gérer les discussions via l'API."""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
    
    async def create_discussion(self, title: str, description: Optional[str] = None) -> Dict:
        """Crée une nouvelle discussion."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/discussions",
                json={"title": title, "description": description}
            )
            response.raise_for_status()
            return response.json()
    
    async def list_discussions(self, skip: int = 0, limit: int = 50) -> List[Dict]:
        """Liste les discussions."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/discussions",
                params={"skip": skip, "limit": limit}
            )
            response.raise_for_status()
            return response.json()
    
    async def get_discussion(self, discussion_id: int) -> Dict:
        """Récupère une discussion avec tous ses messages."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/discussions/{discussion_id}"
            )
            response.raise_for_status()
            return response.json()
    
    async def update_discussion(self, discussion_id: int, title: Optional[str] = None, 
                               description: Optional[str] = None) -> Dict:
        """Met à jour une discussion."""
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/discussions/{discussion_id}",
                json={"title": title, "description": description}
            )
            response.raise_for_status()
            return response.json()
    
    async def delete_discussion(self, discussion_id: int) -> Dict:
        """Supprime une discussion."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/discussions/{discussion_id}"
            )
            response.raise_for_status()
            return response.json()
    
    async def get_messages(self, discussion_id: int) -> List[Dict]:
        """Récupère les messages d'une discussion."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/discussions/{discussion_id}/messages"
            )
            response.raise_for_status()
            return response.json()
    
    async def delete_message(self, message_id: int) -> Dict:
        """Supprime un message."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/messages/{message_id}"
            )
            response.raise_for_status()
            return response.json()
    
    async def export_discussion(self, discussion_id: int) -> Dict:
        """Exporte une discussion au format JSON."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/discussions/{discussion_id}/export"
            )
            response.raise_for_status()
            return response.json()
    
    async def send_chat_message(self, prompt: str, model: str = "Llama 3.2 3B",
                               system_prompt: Optional[str] = None,
                               discussion_id: Optional[int] = None,
                               history: Optional[List[Dict]] = None) -> Dict:
        """Envoie un message de chat."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat",
                json={
                    "prompt": prompt,
                    "model": model,
                    "systemPrompt": system_prompt or "",
                    "history": history,
                    "discussion_id": discussion_id
                }
            )
            response.raise_for_status()
            return response.json()


# Exemple d'utilisation
async def example_usage():
    """Exemple complet d'utilisation du client."""
    client = DiscussionClient()
    
    # 1. Créer une discussion
    print("1. Création d'une discussion...")
    discussion = await client.create_discussion(
        title="Questions sur Python",
        description="Discussion sur les meilleures pratiques Python"
    )
    discussion_id = discussion['id']
    print(f"Discussion créée: ID {discussion_id}")
    
    # 2. Envoyer un message
    print("\n2. Envoi d'un premier message...")
    response = await client.send_chat_message(
        prompt="Quelles sont les meilleures pratiques en Python?",
        model="Llama 3.2 3B",
        discussion_id=discussion_id
    )
    print(f"Réponse: {response['response'][:100]}...")
    
    # 3. Envoyer un autre message
    print("\n3. Envoi d'un deuxième message...")
    response2 = await client.send_chat_message(
        prompt="Tu peux me donner un exemple concret?",
        model="Llama 3.2 3B",
        discussion_id=discussion_id
    )
    print(f"Réponse: {response2['response'][:100]}...")
    
    # 4. Récupérer les messages
    print("\n4. Récupération des messages...")
    messages = await client.get_messages(discussion_id)
    print(f"Total de messages: {len(messages)}")
    for msg in messages:
        print(f"  - {msg['role']}: {msg['content'][:50]}...")
    
    # 5. Récupérer la discussion complète
    print("\n5. Récupération de la discussion complète...")
    full_discussion = await client.get_discussion(discussion_id)
    print(f"Titre: {full_discussion['title']}")
    print(f"Messages: {len(full_discussion['messages'])}")
    
    # 6. Lister les discussions
    print("\n6. Liste des discussions...")
    discussions = await client.list_discussions(limit=10)
    for disc in discussions:
        print(f"  - {disc['title']} ({disc['message_count']} messages)")
    
    # 7. Exporter la discussion
    print("\n7. Export de la discussion...")
    export = await client.export_discussion(discussion_id)
    print(f"Export réussi: {len(export['messages'])} messages")


if __name__ == "__main__":
    asyncio.run(example_usage())
