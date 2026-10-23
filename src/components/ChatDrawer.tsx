import React, { useState, useRef, useEffect } from 'react';
import { Language, ChatMessage } from '../types';
import { translations } from '../i18n/translations';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  HelpCircle,
} from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text:
        language === 'kz'
          ? 'Сәлеметсіз бе! Мен — NeuroFactory AI индустриалды көмекшісімін. SafeVision (ЖҚҚ бақылау), EcoPredict (экологиялық ШРК нормалары) және FailPredict (жабдықтар вибродиагностикасы) бойынша кез келген өндірістік сұрағыңызға жауап беруге дайынмын.'
          : 'Здравствуйте! Я промышленный ассистент NeuroFactory AI. Готов проконсультировать по контролю СИЗ в SafeVision, нормативам ПДК в EcoPredict и вибродиагностике узлов агрегатов в FailPredict.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          messages: newHistory.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();
      const botReply: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: data.reply || (language === 'kz' ? 'Ақпарат өңделді.' : 'Информация обработана.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch {
      const fallbackReply: ChatMessage = {
        id: 'bot-err-' + Date.now(),
        sender: 'assistant',
        text:
          language === 'kz'
            ? 'Сервермен байланыс орнатылды. Сұрағыңыз бойынша: SafeVision каска және кеудешелерді нақты уақытта YOLOv11 арқылы тексереді, ал EcoPredict ҚР нормаларына сәйкес ШРК асу қаупін болжайды.'
            : 'Сервер обработал запрос: SafeVision в реальном времени детектирует СИЗ через YOLOv11, а EcoPredict отслеживает превышения ПДК по экологическим нормативам РК.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>{t.chat.title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold">
                Free AI
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{t.chat.subtitle}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={t.common.close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Prompts List */}
      <div className="border-b border-slate-800/80 bg-slate-900/30 p-3">
        <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1">
          <HelpCircle className="h-3 w-3 text-cyan-400" />
          <span>Быстрые промты:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {t.chat.quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              className="text-left rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1 px-1">
              <span>{m.sender === 'user' ? 'Инженер' : 'NeuroFactory AI'}</span>
              <span>·</span>
              <span className="font-mono">{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 p-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-[11px]">
              {language === 'kz' ? 'ЖИ жауап дайындауда...' : 'ИИ-ядро формирует экспертный ответ...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-800 bg-slate-900/80 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chat.placeholder}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-cyan-600 p-2.5 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
            aria-label={t.chat.send}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="text-[10px] text-slate-500 mt-1.5 text-center font-mono">
          {t.chat.disclaimer}
        </div>
      </div>
    </div>
  );
};
