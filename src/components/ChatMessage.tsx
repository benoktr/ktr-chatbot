
import React, { useState } from 'react';
import { ChatMessage, MessageRole } from '../types';
import { BotIcon, UserIcon, ClipboardIcon, CheckIcon } from './icons';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === MessageRole.USER;
  const isError = message.role === MessageRole.ERROR;

  const wrapperClasses = `group flex items-start gap-3 my-4 animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`;
  const messageClasses = `relative p-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg break-words shadow-md ${
    isUser
      ? 'bg-blue-600 text-white rounded-br-none'
      : isError
      ? 'bg-red-500 text-white rounded-bl-none'
      : 'bg-slate-800 text-slate-200 rounded-bl-none'
  }`;

  const handleCopy = () => {
    if (!message.text || isCopied) return;

    navigator.clipboard.writeText(message.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className={wrapperClasses}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center shadow-inner">
          <BotIcon className="w-5 h-5 text-slate-300" />
        </div>
      )}
      <div className={messageClasses}>
        {message.text && !isError && (
            <button
                onClick={handleCopy}
                className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} p-1 rounded-full bg-black/20 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none`}
                aria-label="Copy message to clipboard"
                title="Copy to clipboard"
            >
                {isCopied ? (
                    <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                    <ClipboardIcon className="w-4 h-4" />
                )}
            </button>
        )}
        {message.imageUrl && (
            <img 
                src={message.imageUrl} 
                alt="User upload" 
                className="rounded-lg mb-2 max-w-xs"
            />
        )}
        {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
      </div>
      {isUser && (
         <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-800 flex items-center justify-center shadow-inner">
          <UserIcon className="w-5 h-5 text-slate-400" />
        </div>
      )}
    </div>
  );
};

export default ChatMessageComponent;
