import React, { useState, useEffect, useRef } from 'react';
import { SendIcon, MicrophoneIcon, PaperclipIcon, XCircleIcon, CameraIcon, PlusIcon, XIcon } from './icons';
import CameraModal from './CameraModal';

// Fix: Add type definitions for the non-standard Web Speech API.
// This resolves errors about 'SpeechRecognition' not being found.
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList extends Array<SpeechRecognitionResult> {
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult extends Array<SpeechRecognitionAlternative> {
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string, image?: File | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isInputMenuOpen, setIsInputMenuOpen] = useState(false);

  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
      }
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };

    return () => {
        recognition.stop();
    }
  }, []);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureImage = (file: File) => {
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      if (isListening) {
        recognitionRef.current?.stop();
      }
      onSendMessage(input.trim(), selectedImage);
      setInput('');
      handleRemoveImage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput(''); 
      recognitionRef.current.start();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-black/30 backdrop-blur-xl border-t border-slate-700/50">
      {imagePreview && (
        <div className="p-2 border-b border-slate-700/50 max-w-3xl mx-auto">
            <div className="relative inline-block">
                <img src={imagePreview} alt="Selected preview" className="h-20 w-20 object-cover rounded-md" />
                <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    aria-label="Remove image"
                >
                    <XCircleIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
      )}
      <div className="max-w-3xl w-full mx-auto flex items-start p-4 gap-2">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange}
            className="hidden" 
            accept="image/*"
        />
        <div className="relative">
            <button
              type="button"
              onClick={() => setIsInputMenuOpen(p => !p)}
              disabled={isLoading}
              className="p-3 rounded-full text-white disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900/50 transition-all duration-200 flex-shrink-0 transform hover:scale-110"
              aria-label={isInputMenuOpen ? "Close menu" : "Open input options menu"}
            >
              {isInputMenuOpen ? (
                  <XIcon className="w-6 h-6 text-slate-400" />
              ) : (
                  <PlusIcon className="w-6 h-6 text-slate-400" />
              )}
            </button>
            {isInputMenuOpen && (
              <div className="absolute bottom-full mb-2 w-48 bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-lg p-2 z-10">
                  <button
                      type="button"
                      onClick={() => { fileInputRef.current?.click(); setIsInputMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                      <PaperclipIcon className="w-5 h-5" />
                      Attach File
                  </button>
                  <button
                      type="button"
                      onClick={() => { setIsCameraModalOpen(true); setIsInputMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                      <CameraIcon className="w-5 h-5" />
                      Use Camera
                  </button>
                  <button
                      type="button"
                      onClick={handleToggleListening}
                      disabled={!recognitionRef.current}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
                  >
                      {isListening ? (
                        <MicrophoneIcon className="w-5 h-5 text-red-500 animate-pulse" />
                      ) : (
                        <MicrophoneIcon className="w-5 h-5" />
                      )}
                      <span>{isListening ? "Listening..." : "Voice Input"}</span>
                  </button>
              </div>
            )}
        </div>
        <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask KTR anything..."
            className="flex-grow bg-slate-800 text-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
            rows={1}
            disabled={isLoading}
            style={{ maxHeight: '120px' }}
        />
        <button
            type="submit"
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="p-3 rounded-full bg-blue-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900/50 transition-all duration-200 flex-shrink-0 transform hover:scale-110"
            aria-label="Send message"
        >
            {isLoading ? (
                <div className="w-6 h-6 border-t-2 border-white border-solid rounded-full animate-spin"></div>
            ) : (
                <SendIcon className="w-6 h-6" />
            )}
        </button>
      </div>
      <CameraModal 
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCaptureImage}
      />
    </form>
  );
};

export default ChatInput;