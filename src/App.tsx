
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chat, Content, Part } from '@google/genai';
import { createChatSession } from './services/geminiService';
import { ChatMessage, MessageRole, ChatSession } from './types';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoginModal from './components/LoginModal';
import ChatHistorySidebar from './components/ChatHistorySidebar';
import { BotIcon, BellIcon, BellSlashIcon, MenuIcon } from './components/icons';
import Snowfall from './components/Snowfall';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

const App: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const activeChat = useMemo(() => 
    chatSessions.find(s => s.id === activeChatId),
    [chatSessions, activeChatId]
  );
  const messages = activeChat?.messages ?? [];
  const lastMessage = messages[messages.length - 1];

  const handleNewChat = useCallback(() => {
    const newChatId = Date.now().toString();
    const initialMessageText = "Hello! I'm KTR. How can I assist you today?";
    const newChat: ChatSession = {
      id: newChatId,
      messages: [{ role: MessageRole.MODEL, text: initialMessageText }],
      history: [{ role: 'model', parts: [{ text: initialMessageText }] }],
    };
    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
        const savedHistory = localStorage.getItem(`ktr_chat_history_${user.email}`);
        if (savedHistory) {
            try {
                const parsedHistory: ChatSession[] = JSON.parse(savedHistory);
                const migratedHistory = parsedHistory.map(session => {
                    if (!session.history) {
                        session.history = session.messages
                            .filter(msg => (msg.role === MessageRole.USER || msg.role === MessageRole.MODEL) && msg.text)
                            .map(msg => ({
                                role: msg.role as 'user' | 'model',
                                parts: [{ text: msg.text }],
                            }));
                    }
                    return session;
                });
                if (migratedHistory.length > 0) {
                    setChatSessions(migratedHistory);
                    setActiveChatId(migratedHistory[0].id);
                } else {
                    handleNewChat();
                }
            } catch {
                handleNewChat();
            }
        } else {
            handleNewChat();
        }
    } else {
        setChatSessions([]);
        setActiveChatId(null);
    }
  }, [user, handleNewChat]);
  
  useEffect(() => {
    if (user && chatSessions.length > 0) {
        localStorage.setItem(`ktr_chat_history_${user.email}`, JSON.stringify(chatSessions));
    }
  }, [chatSessions, user]);

  useEffect(() => {
    if (!activeChat) {
      chatRef.current = null;
      return;
    }

    try {
      chatRef.current = createChatSession(activeChat.history);
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      setChatSessions(prev =>
        prev.map(s =>
          s.id === activeChatId
            ? { ...s, messages: [...s.messages, { role: MessageRole.ERROR, text: "Error re-initializing chat. Please check your API key." }] }
            : s
        )
      );
    }
  }, [activeChat, activeChatId]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support desktop notification.');
      return;
    }
    if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in your browser settings.');
        return;
    }
    if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    }
  };

  const handleSendMessage = async (userMessage: string, image?: File | null) => {
    if (!chatRef.current || !activeChatId) {
        console.error("Chat session not active.");
        return;
    }

    setIsLoading(true);
    let imageUrl: string | undefined = undefined;
    if (image) {
        imageUrl = URL.createObjectURL(image);
    }
    const userMsg: ChatMessage = { role: MessageRole.USER, text: userMessage, imageUrl };
    
    const apiParts: Part[] = [];
    if (userMessage) {
      apiParts.push({ text: userMessage });
    }
    if (image) {
        const base64Data = await fileToBase64(image);
        apiParts.push({
            inlineData: {
                mimeType: image.type,
                data: base64Data,
            },
        });
    }

    const userContentForHistory: Content = { role: 'user', parts: apiParts };
    const modelContentForHistory: Content = { role: 'model', parts: [{ text: '' }] };

    setChatSessions(prev => 
      prev.map(session => 
        session.id === activeChatId 
        ? { 
            ...session, 
            messages: [...session.messages, userMsg, { role: MessageRole.MODEL, text: '' }],
            history: [...session.history, userContentForHistory, modelContentForHistory]
          }
        : session
      )
    );

    let modelResponse = '';
    try {
      const stream = await chatRef.current.sendMessageStream({ message: apiParts });
      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setChatSessions(prev => 
          prev.map(session => {
            if (session.id === activeChatId) {
              const newMessages = [...session.messages];
              const currentLastMessage = newMessages[newMessages.length - 1];
              if (currentLastMessage) {
                currentLastMessage.text = modelResponse;
              }

              const newHistory = [...session.history];
              const lastHistory = newHistory[newHistory.length - 1];
              if (lastHistory && lastHistory.parts[0]) {
                (lastHistory.parts[0] as {text: string}).text = modelResponse;
              }
              
              return { ...session, messages: newMessages, history: newHistory };
            }
            return session;
          })
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: ChatMessage = { role: MessageRole.ERROR, text: "Sorry, something went wrong. Please try again." };
      setChatSessions(prev => 
        prev.map(session =>
          session.id === activeChatId
            ? { ...session, messages: [...session.messages.slice(0, -1), errorMsg] }
            : session
        )
      );
    } finally {
      setIsLoading(false);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (notificationPermission === 'granted' && document.hidden) {
        const notification = new Notification('New message from KTR ChatBot', {
            body: modelResponse.substring(0, 150) + (modelResponse.length > 150 ? '...' : ''),
            icon: '/vite.svg',
        });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
      }
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };

  const handleLogin = (email: string) => {
    setUser({ email });
    setIsLoginModalOpen(false);
  };
  
  const handleSignOut = () => {
    setUser(null);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all chat history? This action cannot be undone.")) {
        if (user) {
            localStorage.removeItem(`ktr_chat_history_${user.email}`);
        }
        // Reset the state to a single new chat
        const newChatId = Date.now().toString();
        const initialMessageText = "Hello! I'm KTR. How can I assist you today?";
        const newChat: ChatSession = {
          id: newChatId,
          messages: [{ role: MessageRole.MODEL, text: initialMessageText }],
          history: [{ role: 'model', parts: [{ text: initialMessageText }] }],
        };
        setChatSessions([newChat]);
        setActiveChatId(newChatId);
    }
  };

  return (
    <div className="h-screen animated-gradient-bg text-white font-sans relative">
      {user && <Snowfall />}
      <div className="relative z-10 flex h-full">
        {user && (
          <ChatHistorySidebar
            isOpen={isSidebarOpen}
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onClearHistory={handleClearHistory}
          />
        )}
        <div className="flex flex-col flex-1 h-screen">
          <header className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-md z-10">
            <div className="flex items-center">
                {user && (
                    <button onClick={() => setIsSidebarOpen(p => !p)} className="mr-3 p-2 rounded-full hover:bg-white/10 md:hidden">
                        <MenuIcon className="w-6 h-6 text-slate-300"/>
                    </button>
                )}
                <BotIcon className="w-8 h-8 text-blue-400 animate-pulse-glow" />
                <h1 className="ml-3 text-xl font-bold animated-text-gradient">KTR ChatBot</h1>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={handleRequestNotificationPermission}
                    className="p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900/50 transition-colors"
                    aria-label="Toggle notifications"
                    title={notificationPermission === 'granted' ? 'Notifications are enabled' : notificationPermission === 'denied' ? 'Notifications are blocked' : 'Enable notifications'}
                >
                    {notificationPermission === 'granted' ? <BellIcon className="w-6 h-6 text-green-400" /> : <BellSlashIcon className="w-6 h-6 text-slate-400" />}
                </button>
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="hidden sm:block">{user.email}</span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 text-sm font-medium text-slate-200 bg-white/5 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900/50 transition-colors"
                    >
                        Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-slate-200 bg-white/5 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900/50 transition-colors"
                  >
                      Sign In
                  </button>
                )}
            </div>
          </header>
          
          <main ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                {messages.map((msg, index) => (
                    <ChatMessageComponent key={index} message={msg} />
                ))}
                {isLoading && lastMessage && lastMessage.role === MessageRole.MODEL && !lastMessage.text && (
                    <div className="flex items-start gap-3 my-4 justify-start animate-fade-in-up">
                         <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center">
                            <BotIcon className="w-5 h-5 text-slate-300" />
                         </div>
                         <div className="p-3 rounded-2xl bg-slate-800 text-slate-200 rounded-bl-none">
                             <div className="flex items-center justify-center space-x-2 bouncing-loader">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                             </div>
                         </div>
                    </div>
                )}
            </div>
          </main>

          <footer className="w-full">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </footer>
        </div>
      </div>
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default App;