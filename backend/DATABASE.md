# Documentation Base de Données

## Présentation

Le système de stockage de messages et discussions est maintenant intégré au backend. Les messages et discussions sont stockés dans une base de données SQLite (par défaut) ou PostgreSQL (via variable d'environnement).

## Structure de la Base de Données

### Tables

#### 1. `discussions`
Représente une conversation/discussion complète.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | Integer | Identifiant unique (clé primaire) |
| `title` | String(255) | Titre de la discussion |
| `description` | Text | Description optionnelle |
| `created_at` | DateTime | Date de création (UTC) |
| `updated_at` | DateTime | Date mise à jour (UTC) |

#### 2. `messages`
Représente un message individuel dans une discussion.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | Integer | Identifiant unique (clé primaire) |
| `discussion_id` | Integer | Référence à la discussion (clé étrangère) |
| `role` | String(50) | Rôle : 'user' ou 'assistant' |
| `content` | Text | Contenu du message |
| `model` | String(100) | Modèle utilisé (si assistant) |
| `system_prompt` | Text | Prompt système utilisé (optionnel) |
| `created_at` | DateTime | Date de création (UTC) |

## Configuration

### Variables d'Environnement

Pour utiliser PostgreSQL au lieu de SQLite :
```bash
export DATABASE_URL="postgresql://user:password@localhost/chat_db"
```

Par défaut, SQLite est utilisé et crée un fichier `chat_history.db` dans le répertoire du backend.

## Endpoints API

### Gestion des Discussions

#### Créer une discussion
```
POST /discussions
Body: {
  "title": "Mon projet",
  "description": "Description optionnelle"
}
```

#### Lister les discussions
```
GET /discussions?skip=0&limit=50
```

#### Récupérer une discussion avec ses messages
```
GET /discussions/{discussion_id}
```

#### Mettre à jour une discussion
```
PUT /discussions/{discussion_id}
Body: {
  "title": "Nouveau titre",
  "description": "Nouvelle description"
}
```

#### Supprimer une discussion (et ses messages)
```
DELETE /discussions/{discussion_id}
```

### Chat avec Stockage

#### Envoyer un message (stocke automatiquement)
```
POST /chat
Body: {
  "prompt": "Ton message",
  "model": "Llama 3.2 3B",
  "systemPrompt": "Prompt système optionnel",
  "history": [...],
  "discussion_id": 1  // Optionnel, crée une nouvelle discussion si absent
}

Response: {
  "response": "Réponse du modèle",
  "discussion_id": 1,
  "message_id": 5
}
```

### Gestion des Messages

#### Récupérer tous les messages d'une discussion
```
GET /discussions/{discussion_id}/messages
```

#### Supprimer un message
```
DELETE /messages/{message_id}
```

#### Exporter une discussion (JSON)
```
GET /discussions/{discussion_id}/export
```

Response inclut tous les messages formatés avec métadonnées.

## Installation des Dépendances

Ajoute les packages requis à ton projet :
```bash
pip install sqlalchemy
```

Si tu utilises PostgreSQL :
```bash
pip install psycopg2-binary
```

## Utilisation dans le Frontend

### Exemple 1 : Nouvelle discussion

```javascript
// Créer une nouvelle discussion
const resp = await fetch('http://localhost:8000/discussions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Titre de ma discussion"
  })
});
const discussion = await resp.json();
const discussionId = discussion.id;

// Envoyer un message (stocké automatiquement)
const chatResp = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Bonjour, comment vas-tu?",
    model: "Llama 3.2 3B",
    discussion_id: discussionId
  })
});
const result = await chatResp.json();
console.log(result.response);
```

### Exemple 2 : Récupérer l'historique

```javascript
// Récupérer tous les messages d'une discussion
const resp = await fetch('http://localhost:8000/discussions/1/messages');
const messages = await resp.json();

// Afficher les messages
messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### Exemple 3 : Lister les discussions

```javascript
// Récupérer la liste des discussions
const resp = await fetch('http://localhost:8000/discussions');
const discussions = await resp.json();

discussions.forEach(disc => {
  console.log(`${disc.title} - ${disc.message_count} messages`);
});
```

## Notes Importantes

1. **Création Automatique de Discussion** : Si tu ne fournis pas `discussion_id` dans le endpoint `/chat`, une nouvelle discussion sera créée automatiquement avec un titre généré à partir du premier message.

2. **Timestamps UTC** : Tous les timestamps sont en UTC (Coordinated Universal Time).

3. **Cascade Delete** : Supprimer une discussion supprime automatiquement tous ses messages.

4. **Performance** : Pour de grandes discussions avec beaucoup de messages, utilise PostgreSQL pour de meilleures performances.

5. **Sauvegarde** : La base de données SQLite (`chat_history.db`) doit être sauvegardée régulièrement.

## Schéma Complet

```
discussions (1) ──────→ (*) messages
    └─── id (PK)
    ├─── title
    ├─── description  
    ├─── created_at
    └─── updated_at
    
                        └─── id (PK)
                        ├─── discussion_id (FK)
                        ├─── role
                        ├─── content
                        ├─── model
                        ├─── system_prompt
                        └─── created_at
```

## Dépannage

### Erreur : "Discussion non trouvée"
Assure-toi que le `discussion_id` existe dans la base de données.

### Erreur de connexion PostgreSQL
Vérifie que :
- PostgreSQL est lancé
- Les identifiants dans `DATABASE_URL` sont corrects
- La base de données existe

### Fichier `chat_history.db` disparaît
En développement local, assure-toi que le répertoire du backend n'est pas nettoyé par des scripts de build.
