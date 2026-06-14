import { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  Sparkles, 
  Send, 
  HelpCircle,
  TrendingDown,
  Info,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isMocked?: boolean;
}

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "Hello! I am your EcoTrack AI Assistant. I can analyze your daily logs and give you tailored advice to reduce your footprint. Ask me anything or select a prompt below!",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    { label: "General Reduction Plan", query: "How can I reduce my carbon footprint?" },
    { label: "Transport Carbon Guide", query: "How can I cut down my transport carbon footprint?" },
    { label: "Diet Impact Assessment", query: "Tell me about my food habits impact and how to optimize it." },
    { label: "Home Power Savings", query: "How can I lower my electricity emissions at home?" }
  ];

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const updatedMessages = [...messages, { sender: 'user', text: queryText } as ChatMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${BACKEND_URL}/ai/recommendations`, {
        question: queryText
      }, { headers });

      if (res.data.success) {
        setMessages([
          ...updatedMessages,
          {
            sender: 'ai',
            text: res.data.data.response,
            isMocked: res.data.data.isMocked
          }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        {
          sender: 'ai',
          text: "I apologize, but I encountered an error communicating with the recommendations engine. Please verify the backend is active."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-zinc-900 dark:text-white mt-4 mb-2">
            {trimmed.replace('###', '').trim()}
          </h4>
        );
      }
      
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={idx} className="text-base font-extrabold text-zinc-950 dark:text-zinc-50 mt-5 mb-2.5">
            {trimmed.replace('##', '').trim()}
          </h3>
        );
      }

      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const itemContent = trimmed.substring(1).trim();
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-zinc-600 dark:text-zinc-400 my-1 font-medium">
            {parseBoldText(itemContent)}
          </li>
        );
      }

      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={idx} className="pl-4 text-xs text-zinc-600 dark:text-zinc-400 my-1.5 flex gap-2 font-medium">
            <span className="font-extrabold text-emerald-500">{trimmed.match(/^\d+\./)?.[0]}</span>
            <span>{parseBoldText(trimmed.replace(/^\d+\./, '').trim())}</span>
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={idx} className="h-2"></div>;
      }

      return (
        <p key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed my-1 font-medium">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-zinc-900 dark:text-white">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start max-w-5xl mx-auto">
      
      {/* Column 1: Prompts and suggestions */}
      <div className="space-y-4 lg:col-span-1">
        <div className="bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-500" /> Quick Analysis
          </h3>
          <div className="space-y-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuery(q.query)}
                disabled={loading}
                className="w-full text-left text-xs font-bold p-3 rounded-xl border border-zinc-900 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-zinc-400 hover:text-emerald-400 flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span>{q.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#131317] border border-zinc-800 text-zinc-400 rounded-2xl p-4.5 text-xs flex gap-2.5 items-start">
          <Info className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-emerald-500" />
          <span>The assistant reads your actual carbon logs over the past 2 weeks to evaluate patterns and generate relevant reduction advice.</span>
        </div>
      </div>

      {/* Column 2: Chat box */}
      <div className="lg:col-span-3 bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg flex flex-col h-[600px] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[75%] rounded-2xl p-4.5 shadow-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white font-bold rounded-tr-none'
                  : 'bg-zinc-950/50 border border-zinc-900 text-zinc-900 dark:text-zinc-200 rounded-tl-none'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="text-xs font-bold leading-normal">{msg.text}</p>
                ) : (
                  <div>
                    {renderFormattedText(msg.text)}
                    {msg.isMocked && (
                      <div className="mt-4 border-t border-zinc-900 pt-2.5 text-[9px] text-zinc-500 flex items-center gap-1 font-mono">
                        <TrendingDown className="w-3 h-3 text-emerald-500" />
                        LOCAL ADVISORY ENGINE ACTIVE (NO REAL GEMINI KEY DETECTED)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-zinc-400 flex items-center justify-center flex-shrink-0 border border-zinc-800 font-bold text-xs shadow-sm">
                  U
                </div>
              )}
            </div>
          ))}

          {/* AI Loader */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 w-48 animate-pulse-slow rounded-tl-none">
                <div className="h-2 bg-zinc-800 rounded w-full mb-2"></div>
                <div className="h-2 bg-zinc-800 rounded w-5/6"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-zinc-900 p-4 bg-zinc-950/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(input);
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me how to lower transportation carbon, save utility costs..."
              disabled={loading}
              className="flex-1 bg-[#131317] border border-zinc-800 rounded-xl px-4 py-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/40 text-zinc-50 transition-all disabled:opacity-50 placeholder-zinc-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl px-4.5 py-3 shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
