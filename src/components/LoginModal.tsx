
import React, { useState, useEffect } from 'react';
import { CheckIcon, ClipboardIcon } from './icons';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        // Reset state when modal closes
        setEmail('');
        setPassword('');
        setError('');
        setEmailCopied(false);
        setPasswordCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleCopy = (text: string, type: 'email' | 'password') => {
      navigator.clipboard.writeText(text).then(() => {
          if (type === 'email') {
              setEmailCopied(true);
              setTimeout(() => setEmailCopied(false), 2000);
          } else {
              setPasswordCopied(true);
              setTimeout(() => setPasswordCopied(false), 2000);
          }
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Mock authentication for demonstration
    if (email === 'user@example.com' && password === 'password') {
      onLogin(email);
    } else {
      setError('Incorrect email or password.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-lg p-8 shadow-2xl relative w-full max-w-sm animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-center text-slate-200 mb-6">Sign In</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/80 text-slate-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/80 text-slate-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              placeholder="password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-200"
          >
            Sign In
          </button>
          <div className="text-xs text-slate-500 mt-4 border-t border-slate-700/50 pt-3 space-y-2">
            <p className="font-semibold text-slate-400 text-center mb-2">For Demonstration:</p>
            <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-md">
                <span className="truncate">Email: <span className="font-mono text-slate-300">user@example.com</span></span>
                <button type="button" onClick={() => handleCopy('user@example.com', 'email')} title="Copy email" className="p-1 rounded-full hover:bg-slate-700 transition-colors flex-shrink-0 ml-2">
                    {emailCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4 text-slate-400" />}
                </button>
            </div>
            <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-md">
                <span>Password: <span className="font-mono text-slate-300">password</span></span>
                <button type="button" onClick={() => handleCopy('password', 'password')} title="Copy password" className="p-1 rounded-full hover:bg-slate-700 transition-colors flex-shrink-0 ml-2">
                    {passwordCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4 text-slate-400" />}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
