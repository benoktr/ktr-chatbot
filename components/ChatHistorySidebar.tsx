
import React from 'react';
import { ChatSession } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  chatSessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onClearHistory: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  chatSessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  onClearHistory,
}) => {

  const getPreviewText = (session: ChatSession) => {
    const text = session.messages.find(m => m.role === 'user')?.text 
      || session.messages[0]?.text 
      || 'New Chat';
    return text.substring(0, 40) + (text.length > 40 ? '...' : '');
  };

  return (
    <aside
      className={`absolute md:relative z-20 flex flex-col h-full bg-black/30 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 w-64 flex-shrink-0`}
    >
        <div className="p-4 border-b border-white/10">
            <button
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-white/5 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900/50 transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
                New Chat
            </button>
        </div>
        <nav className="flex-grow overflow-y-auto p-2">
            <ul>
                {chatSessions.map((session) => (
                    <li key={session.id}>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onSelectChat(session.id);
                            }}
                            className={`block p-3 my-1 rounded-md text-sm truncate transition-colors ${
                                activeChatId === session.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50'
                            }`}
                        >
                            {getPreviewText(session)}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
        <div className="p-2 border-t border-white/10">
             <button
                onClick={onClearHistory}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 rounded-md hover:bg-red-900/50 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900/50 transition-colors"
                title="Clear all chat history"
            >
                <TrashIcon className="w-5 h-5" />
                Clear History
            </button>
        </div>
    </aside>
  );
};

export default ChatHistorySidebar;