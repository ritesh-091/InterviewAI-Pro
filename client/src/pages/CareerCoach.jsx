import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { Send, Sparkles, MessageSquare, Compass, Terminal, RefreshCw, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const CareerCoach = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'coach',
      text: "Hello! I am your AI Career Coach. I can help guide you through salary negotiations, resume bullet styling, engineering roadmaps, and targeted interview preparation strategies. Ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef(null);
  const { addToast } = useNotification();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async (search = '') => {
    try {
      const data = await apiRequest(`/coach/history${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (data && data.length > 0) {
        setMessages(data);
      } else if (!search) {
        setMessages([
          {
            sender: 'coach',
            text: "Hello! I am your AI Career Coach. I can help guide you through salary negotiations, resume bullet styling, engineering roadmaps, and targeted interview preparation strategies. Ask me anything!"
          }
        ]);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch chat logs history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e, customMsg = '') => {
    if (e) e.preventDefault();
    const query = (customMsg || input).trim();
    if (!query) return;

    if (!customMsg) setInput('');

    // Append user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const historyLog = messages.map(m => ({ sender: m.sender, text: m.text }));
      
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/coach/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: query,
          history: historyLog
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to streaming gateway.');
      }

      // Add coach placeholder block
      setMessages(prev => [...prev, { sender: 'coach', text: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let streamText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  streamText += parsed.text;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { sender: 'coach', text: streamText };
                    return updated;
                  });
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (err) {
      addToast('Coach Connection Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to delete your career coach chat history?')) return;
    try {
      await apiRequest('/coach/history', { method: 'DELETE' });
      addToast('History Purged', 'Your chat logs were deleted.', 'info');
      setMessages([
        {
          sender: 'coach',
          text: "Hello! I am your AI Career Coach. I can help guide you through salary negotiations, resume bullet styling, engineering roadmaps, and targeted interview preparation strategies. Ask me anything!"
        }
      ]);
      setSearchQuery('');
    } catch (err) {
      addToast('Failed to Clear', err.message, 'error');
    }
  };

  // Suggestion templates
  const suggestions = [
    "What is a learning roadmap for Fullstack 2026?",
    "Give me tips to negotiate salary offers",
    "How can I optimize my resume bullet points?"
  ];

  // Helper to format basic markdown-like syntax
  const formatText = (txt) => {
    if (!txt) return '';
    // Format bold text **word**
    let formatted = txt.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
    // Format backticks code `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-white/[0.08] px-1.5 py-0.5 rounded font-mono text-brand-cyan text-[10px]">$1</code>');
    // Format bullet points
    formatted = formatted.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc mt-1">$1</li>');
    // Format paragraph breaks
    formatted = formatted.split('\n').join('<br />');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl font-black text-white">AI Career Coach</h2>
        <p className="text-xs text-brand-textSec">Receive recommendations on salary trends, CV optimization, and learning pipelines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Help Suggestions sidepanel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-4">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest flex items-center gap-1.5">
              <Search className="h-4 w-4 text-brand-indigo" />
              Coach Filters
            </h4>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  fetchHistory(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white placeholder-brand-textSec/30 focus:outline-none focus:border-brand-indigo/40 transition-colors"
              />
              <button
                onClick={handleClearHistory}
                className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-[10px] font-extrabold transition-all flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Purge Logs History
              </button>
            </div>
          </GlassCard>

          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-brand-cyan" />
              Quick Prompts
            </h4>
            <div className="flex flex-col gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(null, s)}
                  className="p-3 text-left rounded-xl border border-white/5 bg-white/[0.01] hover:border-brand-indigo/30 hover:bg-brand-indigo/[0.02] text-[11px] text-brand-textSec hover:text-white transition-all leading-relaxed"
                >
                  {s}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Chat Logs viewport */}
        <div className="lg:col-span-3">
          <GlassCard className="border-white/5 bg-brand-card flex flex-col h-[540px] p-4">
            
            {/* Scrollable messages box */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 p-2">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-[20px] text-xs leading-relaxed border ${
                    m.sender === 'user'
                      ? 'bg-brand-indigo border-brand-indigo/40 text-white rounded-tr-none font-semibold shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                      : 'bg-white/[0.02] border-white/5 text-brand-textSec rounded-tl-none'
                  }`}>
                    {formatText(m.text)}
                  </div>
                </div>
              ))}
              
              {loading && messages[messages.length - 1]?.sender === 'user' && (
                <div className="flex justify-start">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-brand-indigo animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 rounded-full bg-brand-indigo animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 rounded-full bg-brand-indigo animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input submission box */}
            <form onSubmit={handleSendMessage} className="border-t border-white/5 pt-4 flex gap-3">
              <input
                type="text"
                required
                placeholder="Ask advice on roadmap, salary, resume..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-grow px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white placeholder-brand-textSec/30 focus:outline-none focus:border-brand-indigo/40 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="p-3 rounded-xl bg-brand-indigo hover:bg-brand-indigo/90 disabled:bg-brand-indigo/60 text-white transition-colors flex items-center justify-center shadow-lg shadow-brand-indigo/25"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

          </GlassCard>
        </div>

      </div>

    </div>
  );
};

export default CareerCoach;

