"""
Script d'initialisation de la base de données.
Peut être utilisé pour réinitialiser la BD ou ajouter des données de test.
"""

from database import Base, engine, SessionLocal, Discussion, Message
from datetime import datetime, timedelta
import os


def init_database():
    """Crée toutes les tables dans la base de données."""
    print("Création des tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables créées avec succès")


def reset_database():
    """Réinitialise la base de données (supprime toutes les données)."""
    print("Avertissement: Cette action va supprimer TOUTES les données!")
    confirm = input("Êtes-vous sûr? (yes/no): ")
    
    if confirm.lower() != "yes":
        print("Annulé")
        return
    
    print("Suppression des tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ Tables supprimées")
    
    print("Recréation des tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables recréées")


def add_sample_data():
    """Ajoute des données de test à la base de données."""
    db = SessionLocal()
    
    try:
        # Créer quelques discussions d'exemple
        discussions_data = [
            {
                "title": "Introduction à Python",
                "description": "Apprentissage des bases de Python"
            },
            {
                "title": "FastAPI & Web Development",
                "description": "Développement d'APIs modernes"
            },
            {
                "title": "Base de données et ORM",
                "description": "Utilisation de SQLAlchemy"
            }
        ]
        
        discussions = []
        for data in discussions_data:
            disc = Discussion(**data)
            db.add(disc)
            db.flush()  # Pour obtenir l'ID
            discussions.append(disc)
        
        db.commit()
        print(f"✓ {len(discussions)} discussions créées")
        
        # Ajouter des messages d'exemple
        for i, disc in enumerate(discussions):
            messages_data = [
                {"role": "user", "content": f"Bonjour, je veux apprendre {disc.title.lower()}"},
                {"role": "assistant", "content": f"Bien sûr! Je vais t'aider à comprendre {disc.title.lower()}. Commençons par les bases.",
                 "model": "Llama 3.2 3B"},
                {"role": "user", "content": "Tu peux me donner un exemple?"},
                {"role": "assistant", "content": "Voici un exemple concis:\n- Point 1: Lorem ipsum\n- Point 2: Dolor sit\n- Point 3: Amet consectetur",
                 "model": "Llama 3.2 3B"}
            ]
            
            for msg_data in messages_data:
                msg = Message(
                    discussion_id=disc.id,
                    created_at=datetime.utcnow() + timedelta(seconds=len(disc.messages) * 10),
                    **msg_data
                )
                db.add(msg)
        
        db.commit()
        print("✓ Messages d'exemple ajoutés")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Erreur lors de l'ajout des données: {e}")
    finally:
        db.close()


def print_database_info():
    """Affiche des informations sur la base de données."""
    db = SessionLocal()
    
    try:
        num_discussions = db.query(Discussion).count()
        num_messages = db.query(Message).count()
        
        print(f"\nInformations sur la base de données:")
        print(f"  - Discussions: {num_discussions}")
        print(f"  - Messages: {num_messages}")
        
        if num_discussions > 0:
            print(f"\nDiscussions:")
            for disc in db.query(Discussion).all():
                msg_count = db.query(Message).filter_by(discussion_id=disc.id).count()
                print(f"  - [{disc.id}] {disc.title} ({msg_count} messages)")
    finally:
        db.close()


def main():
    """Menu principal."""
    print("=== Outil d'Initialisation de Base de Données ===\n")
    
    # Créer les tables si elles n'existent pas
    if not os.path.exists("chat_history.db"):
        print("Base de données non encontrée. Création...")
        init_database()
        print()
    
    while True:
        print("\nOptions:")
        print("1. Initialiser la base de données")
        print("2. Réinitialiser la base de données (SUPPRIME LES DONNÉES)")
        print("3. Ajouter des données de test")
        print("4. Afficher les informations de la base de données")
        print("5. Quitter")
        
        choice = input("\nChoisir une option (1-5): ").strip()
        
        if choice == "1":
            init_database()
        elif choice == "2":
            reset_database()
        elif choice == "3":
            add_sample_data()
        elif choice == "4":
            print_database_info()
        elif choice == "5":
            print("Au revoir!")
            break
        else:
            print("Option invalide")


if __name__ == "__main__":
    main()
