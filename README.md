# Delsia

Une application de chat avec stockage persistant des discussions et des messages via une API FastAPI + SQLite/PostgreSQL, accompagnée d'une interface frontend React/Vite.

## 📁 Structure du projet

- `backend/` : API FastAPI, modèles SQLAlchemy, schémas Pydantic, client Python et scripts d'initialisation.
- `frontend/` : application React + Vite, hook TypeScript pour consommer l'API backend.
- `QUICKSTART_DB.md` : guide rapide de démarrage pour la base de données.
- `IMPLEMENTATION_SUMMARY.md` : résumé des composants backend et frontend.
- `requirements.txt` : dépendances Python principales pour le backend.

## 🚀 Objectif

Ce projet permet de :

- stocker des discussions et l'historique des messages.
- exposer une API REST complète pour gérer les discussions et les messages.
- envoyer des prompts à un modèle de langage et conserver les échanges en base.
- proposer une interface React pour exploiter ces données.

## 🛠️ Prérequis

### Backend

- Python 3.11+ recommandé
- `pip` pour installer les dépendances

### Frontend

- Node.js 18+ recommandé
- `npm`

## 🔧 Installation et démarrage

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

L'API démarrera par défaut sur `http://localhost:8000`.

- Documentation interactive : `http://localhost:8000/docs`
- Endpoint liste : `GET http://localhost:8000/discussions`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application frontend se lance sur `http://localhost:3000`.

## 🧠 Fonctionnalités principales

### Backend

- gestion des discussions (`/discussions`)
- récupération et export des messages d'une discussion
- enregistrement automatique des messages utilisateur et assistant
- endpoints CRUD pour discussions et messages
- support SQLite par défaut, PostgreSQL via `DATABASE_URL`

### Frontend

- hook `useDiscussions.ts` pour consommer l'API
- gestion des discussions, messages et envoi de prompts
- interface réactive avec Vite + React + TypeScript

## 🚧 Endpoints principaux

### Discussions

- `POST /discussions` : créer une discussion
- `GET /discussions` : lister les discussions
- `GET /discussions/{id}` : récupérer une discussion
- `PUT /discussions/{id}` : mettre à jour une discussion
- `DELETE /discussions/{id}` : supprimer une discussion

### Messages / Chat

- `POST /chat` : envoyer un prompt au modèle et sauvegarder l'échange
- `GET /discussions/{id}/messages` : récupérer les messages d'une discussion
- `DELETE /messages/{id}` : supprimer un message
- `GET /discussions/{id}/export` : exporter une discussion en JSON

### Modèles

Un endpoint `/models` renvoie les modèles disponibles côté backend.

## 📦 Configuration de la base de données

Par défaut, le backend utilise SQLite et crée automatiquement les tables au démarrage.

Si vous souhaitez utiliser PostgreSQL, définissez :

```bash
export DATABASE_URL="postgresql://user:password@localhost/dbname"
```

## 🧪 Développement

### Backend

- `backend/main.py` : point d'entrée de l'API
- `backend/database.py` : modèles SQLAlchemy
- `backend/schemas.py` : schémas de validation Pydantic
- `backend/db_client.py` : client Python pour interagir avec l'API
- `backend/init_db.py` : utilitaire d'initialisation et de nettoyage

### Frontend

- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/hooks/useDiscussions.ts`
- `frontend/src/lib/utils.ts`

## 📘 Documentation complémentaire

- `QUICKSTART_DB.md` : guide de démarrage rapide basé sur la base de données
- `IMPLEMENTATION_SUMMARY.md` : résumé de l'implémentation
- `backend/DATABASE.md` : documentation détaillée de la base de données et des endpoints

## 💡 Conseils

- Lancez d'abord le backend, puis le frontend.
- Vérifiez que l'API backend est disponible avant de tester l'interface React.
- Mettez à jour `DATABASE_URL` uniquement si vous souhaitez utiliser PostgreSQL.

## 🧾 À savoir

- Les discussions sont créées automatiquement si aucun `discussion_id` n'est fourni.
- La suppression d'une discussion supprime aussi ses messages associés.
- Tous les échanges sont stockés et consultables via l'API.

## 📌 Remarque

Ce README présente un point de départ clair pour exécuter et comprendre le projet. Pour des détails techniques supplémentaires, consultez les fichiers existants du dossier `backend/` et `frontend/`.
