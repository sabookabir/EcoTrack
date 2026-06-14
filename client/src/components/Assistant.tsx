import { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  Sparkles, 
  Send, 
  HelpCircle,
  TrendingDown,
  Info,
  ArrowRight,
  RefreshCw,
  Compass,
  Calendar,
  Zap,
  Car,
  Utensils,
  ShoppingBag,
  Trash2,
  Check,
  CheckCircle2,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isMocked?: boolean;
}

interface AssistantProps {
  triggerToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshProfile?: () => void;
}

const COMMITMENTS_KEY = 'ecotrack_weekly_commitments';

export default function Assistant({ triggerToast, refreshProfile }: AssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "Hello! I am EcoGuide AI, your sustainability and climate advisor. I can analyze your daily carbon entries and give you personalized recommendations to reduce your ecological footprint. Ask me anything or select a prompt below!",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoadingMsgIdx, setAiLoadingMsgIdx] = useState(0);

  const aiLoadingMessages = [
    "Analyzing your sustainability data...",
    "Generating recommendations...",
    "Forecasting future impact..."
  ];

  useEffect(() => {
    let timer: any;
    if (loading) {
      setAiLoadingMsgIdx(0);
      timer = setInterval(() => {
        setAiLoadingMsgIdx((prev) => (prev + 1) % aiLoadingMessages.length);
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Weekly Planner commitments state
  const [commitments, setCommitments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COMMITMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const weeklyHabits = [
    { id: 'transit', label: 'Carpool / Transit 2x/wk', co2: 12.5, icon: Car, desc: 'Avoid solo gas car trips.' },
    { id: 'laundry', label: 'Cold wash & line dry', co2: 3.8, icon: Zap, desc: 'Lower water heating load.' },
    { id: 'diet', label: 'Plant meals 3 days/wk', co2: 10.2, icon: Utensils, desc: 'Lower agriculture impact.' },
    { id: 'shopping', label: 'Avoid plastic packaging', co2: 4.5, icon: ShoppingBag, desc: 'Reduce carbon production.' },
    { id: 'compost', label: 'Compost organic waste', co2: 2.5, icon: Trash2, desc: 'Prevent landfill methane.' },
  ];

  const totalReduction = weeklyHabits
    .filter(h => commitments.includes(h.id))
    .reduce((sum, h) => sum + h.co2, 0);

  const handleToggleCommitment = (id: string) => {
    setCommitments(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem(COMMITMENTS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleSaveCommitments = () => {
    if (triggerToast) {
      triggerToast(`Weekly Reduction Plan saved! Targets a reduction of ${totalReduction.toFixed(1)} kg CO₂/week.`, 'success');
    }
    if (refreshProfile) {
      refreshProfile();
    }
  };

  const quickQuestions = [
    { label: "General Reduction Plan", query: "How can I reduce my carbon footprint?" },
    { label: "Transport Commute Guide", query: "How can I cut down my transport carbon footprint?" },
    { label: "Diet Impact Analysis", query: "Tell me about my food habits impact and how to optimize it." },
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
          <h4 key={idx} className="text-xs font-bold text-foreground mt-4 mb-1.5 uppercase tracking-wide">
            {trimmed.replace('###', '').trim()}
          </h4>
        );
      }
      
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={idx} className="text-sm font-black text-foreground mt-5 mb-2">
            {trimmed.replace('##', '').trim()}
          </h3>
        );
      }

      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const itemContent = trimmed.substring(1).trim();
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-muted-foreground my-1 font-medium leading-relaxed">
            {parseBoldText(itemContent)}
          </li>
        );
      }

      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={idx} className="pl-4 text-xs text-muted-foreground my-1.5 flex gap-2 font-medium leading-relaxed">
            <span className="font-extrabold text-primary">{trimmed.match(/^\d+\./)?.[0]}</span>
            <span>{parseBoldText(trimmed.replace(/^\d+\./, '').trim())}</span>
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={idx} className="h-2"></div>;
      }

      return (
        <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-1 font-medium">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-foreground">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto fade-in">
      
      {/* COLUMN 1: WEEKLY PLANNER & INFO */}
      <div className="space-y-6 lg:col-span-1">
        
        {/* Weekly Reduction Planner Card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-primary"></div>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Weekly Planner</h3>
              <p className="text-[10px] text-muted-foreground font-semibold">Commit to habits & save carbon</p>
            </div>
          </div>

          {/* Habit Checklist */}
          <div className="space-y-3 mt-4">
            {weeklyHabits.map((habit) => {
              const HabitIcon = habit.icon;
              const isChecked = commitments.includes(habit.id);
              return (
                <div 
                  key={habit.id}
                  onClick={() => handleToggleCommitment(habit.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isChecked 
                      ? 'bg-emerald-500/[0.02] border-emerald-500/30' 
                      : 'bg-muted/10 border-border/70 hover:bg-muted/30'
                  }`}
                >
                  <div className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                    isChecked 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-border bg-card'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <HabitIcon className={`w-3.5 h-3.5 ${isChecked ? 'text-emerald-500' : 'text-muted-foreground/60'}`} />
                        {habit.label}
                      </span>
                      <span className="text-[9px] font-extrabold text-emerald-600">-{habit.co2}kg</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">{habit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calculator Output */}
          <div className="mt-6 pt-5 border-t border-border flex justify-between items-center">
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Planned Savings</span>
              <span className="text-lg font-black text-emerald-600">{totalReduction.toFixed(1)} <span className="text-xs font-bold">kg CO₂/wk</span></span>
            </div>
            <button
              onClick={handleSaveCommitments}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer transition-all active:scale-[0.98]"
            >
              Commit to Plan
            </button>
          </div>
        </div>

        {/* Informational Widget */}
        <div className="bg-muted/30 border border-border text-muted-foreground rounded-3xl p-5 text-xs flex gap-3 items-start font-medium">
          <Info className="w-4.5 h-4.5 flex-shrink-0 text-primary mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>EcoGuide AI</strong> analyzes your carbon logs and matches them with your weekly commitments to predict offsets and suggest custom actions.
          </p>
        </div>
      </div>

      {/* COLUMN 2 & 3: CHAT DIALOG CONTAINER */}
      <div className="lg:col-span-2 bg-card border border-border rounded-3xl shadow-md flex flex-col h-[600px] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-accent"></div>

        {/* Assistant Header */}
        <div className="px-6 py-4.5 border-b border-border bg-muted/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Animated Glow Avatar */}
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-primary relative">
                <Compass className="w-4.5 h-4.5 animate-spin-slow" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                EcoGuide AI
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </h3>
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Climate AI Assistant</p>
            </div>
          </div>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8.5 h-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[78%] rounded-2xl p-4 shadow-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground font-bold rounded-tr-none text-xs'
                  : 'bg-muted/40 border border-border text-foreground rounded-tl-none'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="text-xs font-bold leading-normal">{msg.text}</p>
                ) : (
                  <div>
                    {renderFormattedText(msg.text)}
                    {msg.isMocked && (
                      <div className="mt-4 border-t border-border/60 pt-2 text-[8px] text-muted-foreground flex items-center gap-1 font-mono font-bold tracking-wider uppercase">
                        <TrendingDown className="w-3 h-3 text-primary" />
                        Local advisory database active
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8.5 h-8.5 rounded-xl bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 border border-border font-extrabold text-xs shadow-sm mt-0.5">
                  U
                </div>
              )}
            </div>
          ))}

          {/* Quick Prompts - Show if messages contain only initial AI greeting */}
          {messages.length === 1 && (
            <div className="pt-4 space-y-3">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">Suggested Inquiries</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuery(q.query)}
                    disabled={loading}
                    className="text-left text-xs font-bold p-3 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-muted-foreground hover:text-primary flex items-center justify-between group cursor-pointer disabled:opacity-50"
                  >
                    <span>{q.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0 text-primary" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-3 justify-start items-start">
              {/* Pulsing circular ecosystem ring with leaf SVG */}
              <div className="relative w-8.5 h-8.5 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 overflow-hidden">
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full ring-rotate">
                  <circle cx="50" cy="50" r="42" stroke="var(--primary)" strokeWidth="3" strokeDasharray="10 8" fill="none" className="opacity-80" />
                </svg>
                {/* Central leaf growing/scaling SVG */}
                <motion.div
                  animate={{ scale: [0.75, 1.15, 0.75] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-emerald-500 z-10"
                >
                  <Leaf className="w-4 h-4 fill-current" />
                </motion.div>
              </div>

              {/* Chat Bubble with Rotating Messages */}
              <div className="bg-muted/40 border border-border rounded-2xl p-4 w-72 rounded-tl-none space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
                  <span className="text-[10px] font-extrabold text-primary dark:text-emerald-400 uppercase tracking-widest">
                    EcoGuide thinking
                  </span>
                </div>
                <div className="h-8 flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={aiLoadingMsgIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                      className="text-xs font-semibold text-muted-foreground leading-relaxed"
                    >
                      {aiLoadingMessages[aiLoadingMsgIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Shimmer line inside the bubble */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 shimmer-bg opacity-30"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="border-t border-border p-4 bg-muted/20">
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
              placeholder="Ask how to reduce transport, lower electricity bill..."
              disabled={loading}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground transition-all disabled:opacity-50 placeholder-muted-foreground/40 font-semibold"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary/95 disabled:opacity-40 text-primary-foreground rounded-xl px-5 py-3 shadow-md shadow-primary/10 transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
