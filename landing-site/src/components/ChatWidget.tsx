import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export function ChatWidget() {
  const { t, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ id: 1, text: t('chat.welcome'), sender: 'bot' }]);
    }
  }, [isOpen, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.id !== 1)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
      conversationHistory.push({ role: 'user', content: text });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const botMsg: Message = { id: Date.now() + 1, text: data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = { id: Date.now() + 1, text: t('chat.error'), sender: 'bot' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 z-50 group w-16 h-16 rounded-full
                     bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600
                     shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-110
                     transition-all duration-300 flex items-center justify-center"
          style={{ [isRtl ? 'left' : 'right']: '1.5rem' }}
          aria-label="Open chat">
          <svg viewBox="0 0 64 64" className="w-9 h-9 text-white drop-shadow-lg" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M32 12c-6 0-11 2-14 6s-4 9-3 14c1 4 3 7 6 9v7a4 4 0 004 4h7V12z" />
            <path d="M32 12c6 0 11 2 14 6s4 9 3 14c-1 4-3 7-6 9v7a4 4 0 01-4 4h-7V12z" />
            <circle cx="24" cy="24" r="2" fill="currentColor" />
            <circle cx="40" cy="24" r="2" fill="currentColor" />
            <circle cx="28" cy="34" r="1.5" fill="currentColor" />
            <circle cx="36" cy="34" r="1.5" fill="currentColor" />
            <line x1="24" y1="24" x2="28" y2="34" />
            <line x1="40" y1="24" x2="36" y2="34" />
            <line x1="24" y1="24" x2="40" y2="24" />
          </svg>
          <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 z-50 sm:w-[380px] sm:max-w-[calc(100vw-2rem)]
                       sm:rounded-2xl overflow-hidden border-0 sm:border sm:border-white/15
                       shadow-2xl shadow-black/50 flex flex-col h-full sm:h-[520px]"
          style={{
            [isRtl ? 'left' : 'right']: typeof window !== 'undefined' && window.innerWidth >= 640 ? '1.5rem' : undefined,
            direction: isRtl ? 'rtl' : 'ltr'
          }}>

          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-5 py-4
                         flex items-center justify-between flex-shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{t('chat.title')}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/70 text-xs">{t('chat.online')}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-sm'
                    : 'bg-white/10 text-slate-200 border border-white/10 rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 rounded-bl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-sm text-slate-400">{t('chat.thinking')}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 p-3 bg-slate-900 border-t border-white/10 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <input ref={inputRef} type="text" value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={t('chat.inputPlaceholder')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                         text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50
                         focus:bg-white/10 transition-all" />
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600
                         flex items-center justify-center hover:shadow-lg hover:shadow-cyan-500/30
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
                <Send className={`w-4 h-4 text-white ${isRtl ? 'scale-x-[-1]' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
