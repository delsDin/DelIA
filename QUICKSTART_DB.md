# Base de Données - Guide de Démarrage Rapide

## 🎯 Vue d'ensemble

Vous avez maintenant une base de données complète pour stocker l'historique des messages et discussions. Voici ce qui a été implémenté :

### ✅ Fichiers Créés/Modifiés

#### Backend
- **`database.py`** - Modèles SQLAlchemy (Discussion, Message)
- **`schemas.py`** - Schémas Pydantic pour l'API
- **`main.py`** - Endpoints API intégrés
- **`db_client.py`** - Client Python asynce pour l'API
- **`init_db.py`** - Outil d'initialisation/réinitialisation
- **`DATABASE.md`** - Documentation complète
- **`requirements.txt`** - Dépendances Python mises à jour

#### Frontend
- **`src/hooks/useDiscussions.ts`** - Hook React pour gérer les discussions

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

### 2. Initialiser la base de données

```bash
# Option 1: Script interactif
python init_db.py

# Option 2: Manuel (les tables sont créées automatiquement au démarrage)
python main.py
```

### 3. Démarrer le backend

```bash
cd backend
python main.py
```

L'API sera disponible à `http://localhost:8000`

Consultez la doc interactive: `http://localhost:8000/docs`

## 📋 Fonctionnalités Principales

### 1. Gestion des Discussions
- ✅ Créer une nouvelle discussion
- ✅ Lister les discussions
- ✅ Récupérer une discussion avec tous ses messages
- ✅ Mettre à jour une discussion (titre, description)
- ✅ Supprimer une discussion

### 2. Chat avec Stockage Automatique
- ✅ Les messages sont automatiquement sauvegardés
- ✅ Les discussions sont créées automatiquement si nécessaire
- ✅ Support des modèles multiples
- ✅ Métadonnées capturées (model, system_prompt, timestamps)

### 3. Historique des Messages
- ✅ Récupérer l'historique complet
- ✅ Supprimer des messages individuels
- ✅ Exporter une discussion en JSON

## 💻 Exemples d'Utilisation

### Créer une Discussion

```bash
curl -X POST "http://localhost:8000/discussions" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ma discussion",
    "description": "Description optionnelle"
  }'
```

### Envoyer un Message

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Bonjour, comment vas-tu?",
    "model": "Llama 3.2 3B",
    "discussion_id": 1
  }'
```

### Récupérer les Messages

```bash
curl "http://localhost:8000/discussions/1/messages"
```

### Lister les Discussions

```bash
curl "http://localhost:8000/discussions?limit=10"
```

## 🔌 Intégration Frontend

Utilisez le hook `useDiscussions` dans vos composants React :

```typescript
import { useDiscussions } from '@/hooks/useDiscussions';

function ChatComponent() {
  const { 
    sendMessage, 
    getMessages, 
    createDiscussion,
    listDiscussions 
  } = useDiscussions();

  // Créer une discussion et envoyer un message
  const handleChat = async () => {
    const discussion = await createDiscussion("Mon chat");
    const response = await sendMessage(
      "Bonjour!",
      "Llama 3.2 3B",
      discussion?.id
    );
  };

  return (...);
}
```

## 📊 Structure de la Base de Données

```
discussions (1 -- ∞) messages
├── id, title, description, created_at, updated_at
└── id, discussion_id, role, content, model, created_at
```

- **SQLite** par défaut (fichier `chat_history.db`)
- **PostgreSQL** optionnel (variable `DATABASE_URL`)

## 🛠️ Configuration

### Variables d'Environnement

```bash
# .env (optionnel)
DATABASE_URL=sqlite:///./chat_history.db
# ou pour PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/delsia_db
```

## 📝 Prochaines Étapes

1. **Modifier le Frontend** - Intégrez le hook `useDiscussions` dans votre UI
2. **Ajouter des Migrations** - Utilisez Alembic pour gérer les évolutions du schéma
3. **Optimisation** - Ajoutez des indices pour les grandes discussions
4. **Sauvegarde** - Mettez en place une stratégie de backup de la BD
5. **Authentification** - Ajoutez des endpoints d'authentification

## 🐛 Dépannage

### "ModuleNotFoundError: No module named 'sqlalchemy'"

```bash
pip install sqlalchemy
```

### "Discussion non trouvée"

Vérifiez que le `discussion_id` existe.

### La BD SQLite est supprimée

`chat_history.db` est créé dans le répertoire du backend. Ne nettoyez pas ce fichier !

## 📚 Documentation Complète

Voir [DATABASE.md](./DATABASE.md) pour la documentation détaillée.

## ✨ Points Clés

- Les messages sont **sauvegardés automatiquement** lors du chat
- Les discussions sont créées **automatiquement** si nécessaire
- Tous les **timestamps sont en UTC**
- Les **timestamps sont au format ISO 8601**
- La base de données **est créée automatiquement** au démarrage

## 🎓 Cas d'Usage

### Suivre une conversation complète
```typescript
const discussion = await createDiscussion("Mon sujet");
await sendMessage("Question 1", model, discussion.id);
await sendMessage("Question 2", model, discussion.id);
const messages = await getMessages(discussion.id);
```

### Continuer une conversation
```typescript
const discussion = await getDiscussion(discussionId);
const messages = await getMessages(discussionId);
// Afficher les messages existants
await sendMessage("Suite", model, discussionId);
```

### Exporter une discussion
```typescript
const exported = await exportDiscussion(discussionId);
// exported inclut tous les messages formatés
```

---

**Bon développement! 🚀**
