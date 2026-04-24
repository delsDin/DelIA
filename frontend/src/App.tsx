import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Plus, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  History, 
  MoreVertical,
  User,
  Sparkles,
  Send,
  Mic,
  Image as ImageIcon,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  Paperclip,
  X,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from './lib/utils';
import { Message, ChatSession } from './types';

const INITIAL_SUGGESTIONS = [
  { icon: '🎨', text: "Aide-moi à rédiger un e-mail de remerciement professionnel" },
  { icon: '💡', text: "Explique-moi le concept de l'informatique quantique simplement" },
  { icon: '🎮', text: "Jouons au jeu de rôle informatique !" },
  { icon: '📅', text: "Établis-moi un emploi du temps" },
];

const CodeBlock: React.FC<{ children: string; language: string | undefined }> = ({ children, language }) => {
  const [isCopied, setIsCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] text-gray-300 text-xs font-mono">
        <span className="capitalize">{language || 'text'}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          }}
          className="p-1 hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[10px]">{isCopied ? 'Copié !' : 'Copier'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ backgroundColor: '#121212', margin: 0, padding: '1.25rem', fontSize: '0.9rem' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Llama 3.2 3B');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(['Llama 3.2 3B', 'Llama 3.2 1B']);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showInstructionsBox, setShowInstructionsBox] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File, preview: string, type: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages, isLoading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  // Charger la liste des modèles disponibles
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:8000/models');
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          // Si le modèle sélectionné n'est pas dans la liste, utiliser le premier
          if (!data.models.includes(selectedModel)) {
            setSelectedModel(data.models[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        // Utiliser les modèles par défaut en cas d'erreur
      }
    };
    fetchModels();

    const storedInstructions = window.localStorage.getItem('customInstructions');
    if (storedInstructions) {
      setCustomInstructions(storedInstructions);
      setShowInstructionsBox(!!storedInstructions);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('customInstructions', customInstructions);
  }, [customInstructions]);

  // Charger les discussions existantes depuis la base de données
  useEffect(() => {
    const loadDiscussions = async () => {
      try {
        const response = await fetch('http://localhost:8000/discussions');
        const discussions = await response.json();
        
        if (discussions && discussions.length > 0) {
          // Charger les messages pour chaque discussion
          const sessionsWithMessages: ChatSession[] = [];
          
          for (const disc of discussions) {
            const msgResponse = await fetch(`http://localhost:8000/discussions/${disc.id}`);
            const discDetail = await msgResponse.json();
            
            const session: ChatSession = {
              id: disc.id.toString(),
              title: disc.title || 'Discussion sans titre',
              messages: (discDetail.messages || []).map((msg: any) => ({
                id: msg.id.toString(),
                role: msg.role === 'assistant' ? 'model' : msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at).getTime(),
              })),
              updatedAt: new Date(disc.updated_at).getTime(),
            };
            
            sessionsWithMessages.push(session);
          }
          
          // Trier par date de modification (plus récent en premier)
          sessionsWithMessages.sort((a, b) => b.updatedAt - a.updatedAt);
          setSessions(sessionsWithMessages);
          
          // Charger la discussion la plus récente
          if (sessionsWithMessages.length > 0) {
            setCurrentSessionId(sessionsWithMessages[0].id);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des discussions:", error);
      }
    };
    
    loadDiscussions();
  }, []);

  const createNewSession = () => {
    // Créer une session locale temporaire sans titre
    const tempId = `temp-${Date.now()}`;
    const newSession: ChatSession = {
      id: tempId,
      title: 'Nouvelle discussion',
      messages: [],
      updatedAt: Date.now(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(tempId);
    setInput('');
    setAttachments([]);
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          file,
          preview: reader.result as string,
          type: file.type
        }]);
      };
      if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        reader.readAsDataURL(file);
      } else {
        // For text/code files, we just store the name as preview or a generic icon
        setAttachments(prev => [...prev, {
          file,
          preview: file.name,
          type: file.type
        }]);
      }
    });
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (text: string = input) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);

    let sessionId = currentSessionId;
    
    // ⭐ ÉTAPE 1: Converter session temp -> réelle si nécessaire
    if (sessionId && sessionId.startsWith('temp-')) {
      try {
        const response = await fetch('http://localhost:8000/discussions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
            description: ''
          })
        });
        
        if (!response.ok) throw new Error('Erreur création discussion');
        
        const discussion = await response.json();
        const realSessionId = discussion.id.toString();
        const oldTempId = sessionId;
        
        // Converter la session temporaire en vraie session avec messages vides
        setSessions(prev => {
          const updated = prev.map(s => 
            s.id === oldTempId 
              ? { ...s, id: realSessionId, title: discussion.title, updatedAt: new Date(discussion.updated_at).getTime() }
              : s
          );
          return updated;
        });
        
        sessionId = realSessionId;
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error("Erreur lors de la création de la discussion:", error);
        return;
      }
    }
    
    // ⭐ ÉTAPE 2: Créer la nouvelle discussion si aucune session
    if (!sessionId) {
      try {
        const response = await fetch('http://localhost:8000/discussions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
            description: ''
          })
        });
        
        if (!response.ok) throw new Error('Erreur création discussion');
        
        const discussion = await response.json();
        const newSessionId = discussion.id.toString();
        const newSession: ChatSession = {
          id: newSessionId,
          title: discussion.title,
          messages: [],
          updatedAt: new Date(discussion.updated_at).getTime(),
        };
        
        setSessions(prev => [newSession, ...prev]);
        sessionId = newSessionId;
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error("Erreur lors de la création de la discussion:", error);
        return;
      }
    }

    // ⭐ ÉTAPE 3: Créer les messages et get la session courante
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      role: 'model',
      content: '...',
      timestamp: Date.now(),
    };

    // Récupérer l'historique complet AVANT d'ajouter les messages
    const session = sessions.find(s => s.id === sessionId);
    const messagesBeforeUserMessage = session ? session.messages : [];
    const historyForAPI = [...messagesBeforeUserMessage, userMessage].map(({ role, content }) => ({ role, content }));

    // Récupérer les messages actuels (après conversion d'ID si nécessaire)
    // On utilise sessions.find() qui cherche avec le sessionId actuel
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage, typingMessage], 
            updatedAt: Date.now() 
          }
        : s
    ));
    
    setIsLoading(true);

    try {
      const promptPayload = text;
      const discussionId = parseInt(sessionId);
      
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptPayload,
          model: selectedModel,
          systemPrompt: customInstructions,
          history: historyForAPI,
          discussion_id: discussionId,
        }),
      });

      const data = await response.json();
      
      // Recharger les messages de la discussion depuis la base de données 
      const refreshResponse = await fetch(`http://localhost:8000/discussions/${data.discussion_id}`);
      const updatedDiscussion = await refreshResponse.json();
      
      // Mapper les messages reçus du backend 
      const newMessages: Message[] = (updatedDiscussion.messages || []).map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role === 'assistant' ? 'model' : msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
      }));

      // Mettre à jour la session avec les messages reçus du serveur
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? {
              ...s,
              messages: newMessages,
              updatedAt: new Date(updatedDiscussion.updated_at).getTime()
            }
          : s
      ));
    } catch (error) {
      console.error("Error calling local model:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: "Une erreur est survenue lors de la communication avec l'IA locale. Veuillez vérifier votre backend ou réessayer plus tard.",
        timestamp: Date.now(),
      };
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? {
              ...s,
              messages: s.messages.filter(m => m.id !== `typing-${Date.now()}`).concat(errorMessage),
              updatedAt: Date.now()
            }
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };



  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    try {
      // Supprimer la discussion de la base de données
      await fetch(`http://localhost:8000/discussions/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la discussion:", error);
    }
    
    setSessions(sessions.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className={cn(
          "bg-gemini-sidebar h-full flex flex-col transition-all duration-300 ease-in-out border-r border-gemini-border",
          !isSidebarOpen && "border-none"
        )}
      >
        <div className="p-4 flex flex-col h-full overflow-hidden whitespace-nowrap">
          <button 
            onClick={createNewSession}
            className="flex items-center gap-3 px-4 py-3 bg-gemini-border/50 hover:bg-gemini-border rounded-full transition-colors mb-8 group"
          >
            <Plus className="w-5 h-5 text-gray-600 group-hover:text-gemini-blue" />
            <span className="text-sm font-medium text-gray-700">Nouvelle discussion</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Récent</h3>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer transition-all group relative",
                  currentSessionId === session.id ? "bg-blue-100 text-gemini-blue" : "hover:bg-gemini-border/50 text-gray-700"
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{session.title}</span>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 space-y-1 border-t border-gemini-border">
            <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gemini-border/50 rounded-full text-sm text-gray-700 transition-colors">
              <HelpCircle className="w-5 h-5" />
              <span>Aide</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gemini-border/50 rounded-full text-sm text-gray-700 transition-colors">
              <History className="w-5 h-5" />
              <span>Activité</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gemini-border/50 rounded-full text-sm text-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-display font-semibold text-gray-800">DelIA</span>
              <div className="relative">
                <button 
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-[11px] font-bold text-gray-600 uppercase tracking-tight transition-colors"
                >
                  {selectedModel}
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showModelMenu && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showModelMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      {availableModels.map((model) => (
                        <button
                          key={model}
                          onClick={() => {
                            setSelectedModel(model);
                            setShowModelMenu(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm transition-colors",
                            selectedModel === model ? "bg-blue-50 text-gemini-blue font-medium" : "hover:bg-gray-50 text-gray-700"
                          )}
                        >
                          {model}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInstructionsBox(!showInstructionsBox)}
              className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-700 transition-colors"
            >
              {showInstructionsBox ? 'Masquer instructions' : 'Instructions'}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        {showInstructionsBox && (
          <div className="px-4 sm:px-6 md:px-8 pb-4">
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Instructions personnalisées</h3>
                  <p className="text-xs text-gray-500">Ces instructions seront envoyées en tant que contexte système avant votre message.</p>
                </div>
                <span className="text-xs text-gray-500">Modèle actif : {selectedModel}</span>
              </div>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Par exemple : 'Réponds toujours en français, sois concis et adopte un ton professionnel.'"
                className="w-full min-h-[120px] resize-none rounded-3xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        )}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-8 scroll-smooth"
        >
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="max-w-3xl mx-auto mt-12 sm:mt-24 pb-40">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl sm:text-5xl font-display font-medium mb-2">
                  <span className="gemini-gradient-text">Bienvenue, Monsieur Dels</span>
                </h1>
                <h2 className="text-4xl sm:text-5xl font-display font-medium text-gray-300 mb-12">
                  Qu'avez-vous à me demander ?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INITIAL_SUGGESTIONS.map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 + 0.3 }}
                      onClick={() => handleSendMessage(suggestion.text)}
                      className="p-4 bg-gemini-sidebar hover:bg-gemini-border/50 rounded-2xl text-left transition-all group relative overflow-hidden"
                    >
                      <p className="text-sm text-gray-700 pr-8">{suggestion.text}</p>
                      <div className="absolute bottom-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-lg">{suggestion.icon}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 pb-32">
              {currentSession.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 sm:gap-6",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-5 h-5 text-gemini-blue" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 group/msg relative",
                    message.role === 'user' 
                      ? "bg-gemini-sidebar text-gray-800" 
                      : "bg-transparent text-gray-800"
                  )}>
                    <div className="prose prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100">
                      <Markdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';
                            const codeText = String(children).replace(/\n$/, '');

                            if (!inline) {
                              return <CodeBlock language={language} children={codeText} />;
                            }

                            return (
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gemini-blue" {...props}>
                                {children}
                              </code>
                            );
                          },
                          ul({ node, children, ...props }: any) {
                            return (
                              <ul className="list-disc list-inside space-y-2 my-3 ml-2" {...props}>
                                {children}
                              </ul>
                            );
                          },
                          ol({ node, children, ...props }: any) {
                            return (
                              <ol className="list-decimal list-inside space-y-2 my-3 ml-2" {...props}>
                                {children}
                              </ol>
                            );
                          },
                          li({ node, children, ...props }: any) {
                            return (
                              <li className="text-gray-800" {...props}>
                                {children}
                              </li>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </Markdown>
                    </div>
                    
                    {message.role === 'model' && (
                      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                          title="Copier"
                        >
                          {copiedId === message.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                      D
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 sm:gap-6">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                    <Sparkles className="w-5 h-5 text-gemini-blue" />
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-[80%]">
                    <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {/* File Previews */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-wrap gap-2 mb-2 px-4"
                >
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      {att.type.startsWith('image/') ? (
                        <img src={att.preview} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-1">
                          <Paperclip className="w-6 h-6 text-gray-400" />
                          <span className="text-[8px] text-gray-500 truncate w-full text-center">{att.file.name}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-gemini-sidebar rounded-[32px] p-2 pr-4 shadow-sm border border-transparent focus-within:border-gemini-border focus-within:bg-white focus-within:shadow-md transition-all">
              <div className="flex items-end gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelect}
                />
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelect}
                />
                <input 
                  type="file" 
                  ref={audioInputRef} 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={handleFileSelect}
                />

                <input 
                  type="file" 
                  ref={folderInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                />

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Saisissez une invite ici"
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-4 max-h-48 min-h-[56px] text-gray-800 placeholder-gray-500"
                  rows={1}
                  style={{ height: 'auto' }}
                />
                <div className="flex items-center gap-1 pb-2">
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="p-2.5 hover:bg-gray-200 rounded-full transition-colors text-gray-600" 
                    title="Ajouter un dossier"
                  >
                    <Folder className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-gray-200 rounded-full transition-colors text-gray-600" 
                    title="Ajouter un fichier"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2.5 hover:bg-gray-200 rounded-full transition-colors text-gray-600" 
                    title="Ajouter une image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => audioInputRef.current?.click()}
                    className={cn(
                      "p-2.5 hover:bg-gray-200 rounded-full transition-colors text-gray-600",
                      isRecording && "text-red-500 bg-red-50"
                    )} 
                    title="Message vocal"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  {(input.trim() || attachments.length > 0) && (
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={isLoading}
                      className="p-2.5 bg-gemini-blue text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-center text-gray-500 mt-3 px-4">
              DelIA est un projet personnel de Dels. Il utilise des modèles de langage locaux pour garantir la confidentialité et la rapidité, sans dépendre d'API externes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
