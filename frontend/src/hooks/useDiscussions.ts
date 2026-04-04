/**
 * hooks/useDiscussions.ts
 * 
 * Hook React pour gérer les discussions via l'API.
 * Permet de créer, lister, récupérer et supprimer des discussions.
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Message {
  id: number;
  discussion_id: number;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  created_at: string;
}

export interface Discussion {
  id: number;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  message_count?: number;
}

export interface ChatResponse {
  response: string;
  discussion_id: number;
  message_id: number;
}

export const useDiscussions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Créer une discussion
  const createDiscussion = useCallback(async (title: string, description?: string): Promise<Discussion | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lister les discussions
  const listDiscussions = useCallback(async (skip = 0, limit = 50): Promise<Discussion[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/discussions?skip=${skip}&limit=${limit}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer une discussion
  const getDiscussion = useCallback(async (discussionId: number): Promise<Discussion | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/discussions/${discussionId}`);
      if (!response.ok) throw new Error('Discussion non trouvée');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une discussion
  const updateDiscussion = useCallback(async (
    discussionId: number,
    title?: string,
    description?: string
  ): Promise<Discussion | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/discussions/${discussionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer une discussion
  const deleteDiscussion = useCallback(async (discussionId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/discussions/${discussionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Envoyer un message (chat)
  const sendMessage = useCallback(async (
    prompt: string,
    model: string = 'Llama 3.2 3B',
    discussionId?: number,
    systemPrompt?: string,
    history?: Message[]
  ): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          systemPrompt: systemPrompt || '',
          history,
          discussion_id: discussionId
        })
      });
      if (!response.ok) throw new Error('Erreur lors du chat');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les messages
  const getMessages = useCallback(async (discussionId: number): Promise<Message[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/discussions/${discussionId}/messages`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exporter une discussion
  const exportDiscussion = useCallback(async (discussionId: number): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/discussions/${discussionId}/export`);
      if (!response.ok) throw new Error('Erreur lors de l\'export');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createDiscussion,
    listDiscussions,
    getDiscussion,
    updateDiscussion,
    deleteDiscussion,
    sendMessage,
    getMessages,
    deleteMessage,
    exportDiscussion
  };
};

/**
 * Exemple d'utilisation dans un composant:
 * 
 * function ChatComponent() {
 *   const [discussionId, setDiscussionId] = useState<number | null>(null);
 *   const [messages, setMessages] = useState<Message[]>([]);
 *   const { sendMessage, getMessages, createDiscussion } = useDiscussions();
 * 
 *   const handleNewDiscussion = async () => {
 *     const discussion = await createDiscussion("Ma discussion");
 *     if (discussion) setDiscussionId(discussion.id);
 *   };
 * 
 *   const handleSendMessage = async (prompt: string) => {
 *     if (!discussionId) {
 *       const discussion = await createDiscussion("Ma discussion");
 *       if (discussion) setDiscussionId(discussion.id);
 *     }
 *     
 *     const response = await sendMessage(prompt, "Llama 3.2 3B", discussionId);
 *     if (response) {
 *       const updatedMessages = await getMessages(discussionId!);
 *       setMessages(updatedMessages);
 *     }
 *   };
 * 
 *   return (...);
 * }
 */
