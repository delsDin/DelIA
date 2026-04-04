#!/usr/bin/env python3
"""
Script pour vider complètement l'historique de toutes les discussions et messages.
"""

from database import engine, SessionLocal, Base, Discussion, Message, DATABASE_URL
import os
import stat


def clear_all_history():
    """
    Vide complètement toutes les discussions et tous les messages de la base de données.
    """
    db = SessionLocal()
    
    try:
        # Compter les enregistrements avant suppression
        discussions_count = db.query(Discussion).count()
        messages_count = db.query(Message).count()
        
        print(f"Suppression de {messages_count} message(s)...")
        print(f"Suppression de {discussions_count} discussion(s)...")
        
        # Supprimer tous les messages et discussions
        # Les discussions sont supprimées en cascade avec leurs messages
        db.query(Message).delete()
        db.query(Discussion).delete()
        db.commit()
        
        print("\n✓ Historique complètement vidé!")
        print(f"  - {messages_count} message(s) supprimé(s)")
        print(f"  - {discussions_count} discussion(s) supprimée(s)")
        
    except Exception as e:
        print(f"✗ Erreur lors de la suppression: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def drop_and_recreate_tables():
    """
    Alternative: Supprime et recrée toutes les tables (plus complète).
    Utile en cas de corruption de schema.
    """
    print("Suppression et recréation des tables...")
    
    try:
        # Supprimer les fichiers de base de données (pour SQLite)
        if "sqlite" in DATABASE_URL:
            db_files = [
                DATABASE_URL.replace("sqlite:///", ""),
                os.path.join(os.path.dirname(__file__), "..", "chat_history.db"),
                "chat_history.db"
            ]
            for db_file in db_files:
                if os.path.exists(db_file):
                    try:
                        # Rendre le fichier accessible
                        os.chmod(db_file, stat.S_IRUSR | stat.S_IWUSR)
                        os.remove(db_file)
                        print(f"✓ Fichier {db_file} supprimé")
                    except Exception as e:
                        print(f"⚠ Impossible de supprimer {db_file}: {e}")
        
        # Supprimer toutes les tables via SQLAlchemy
        Base.metadata.drop_all(bind=engine)
        print("✓ Tables supprimées")
        
        # Recréer toutes les tables
        Base.metadata.create_all(bind=engine)
        print("✓ Tables recréées")
        print("\n✓ Historique complètement réinitialisé!")
        
    except Exception as e:
        print(f"✗ Erreur lors de la réinitialisation: {e}")
        raise


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--rebuild":
        print("Mode 'rebuild': Suppression et recréation des tables\n")
        drop_and_recreate_tables()
    else:
        print("Mode 'clear': Vidage de l'historique\n")
        clear_all_history()
        print("\nUsage: python3 clear_history.py [--rebuild]")
        print("  (sans --rebuild) Vide seulement les données")
        print("  (--rebuild)      Supprime et recrée les tables")
