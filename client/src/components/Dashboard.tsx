import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from 'recharts';
import { 
  TrendingDown, 
  Download, 
  FileSpreadsheet, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Sparkles,
  School,
  MapPin,
  Globe,
  Leaf,
  Trophy,
  Zap,
  Gauge,
  Car,
  Compass,
  Milestone,
  CheckCircle2,
  Trees,
  Smartphone,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


interface DashboardProps {
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshProfile: () => void;
}

function DashboardSkeleton() {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Calculating your environmental impact...",
    "Analyzing carbon trends...",
    "Growing your ecosystem...",
    "Generating sustainability insights..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 relative overflow-hidden">
      
      {/* Header Banner Skeleton */}
      <div className="bg-card p-6 border border-border rounded-3xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative overflow-hidden">
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 bg-muted rounded shimmer-bg"></div>
          <div className="h-4 w-96 bg-muted rounded shimmer-bg"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-muted rounded-xl shimmer-bg"></div>
          <div className="h-10 w-36 bg-muted rounded-xl shimmer-bg"></div>
        </div>
      </div>

      {/* Rotating Status Statement */}
      <div className="bg-primary/5 dark:bg-emerald-500/5 border border-primary/10 p-4.5 rounded-2xl flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span className="text-xs font-extrabold text-primary dark:text-emerald-400 animate-pulse transition-all duration-300">
          {messages[msgIdx]}
        </span>
      </div>

      {/* Core KPI cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI 1: Total CO2 */}
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden space-y-4">
          <div className="h-4 w-24 bg-muted rounded shimmer-bg"></div>
          <div className="h-8 w-32 bg-muted rounded shimmer-bg"></div>
          <div className="h-4 w-40 bg-muted rounded shimmer-bg"></div>
        </div>
        {/* KPI 2: Score Dial */}
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="h-4 w-28 bg-muted rounded shimmer-bg"></div>
            <div className="h-8 w-20 bg-muted rounded shimmer-bg"></div>
            <div className="h-4 w-32 bg-muted rounded shimmer-bg"></div>
          </div>
          {/* Shimmering Circular Dial */}
          <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              <circle cx="60" cy="60" r="50" stroke="var(--border)" strokeWidth="8" fill="none" />
              <circle cx="60" cy="60" r="50" stroke="var(--muted)" strokeWidth="8" strokeDasharray="314" strokeDashoffset="150" fill="none" className="shimmer-bg" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-5 w-7 bg-muted rounded shimmer-bg"></div>
            </div>
          </div>
        </div>
        {/* KPI 3: Streaks */}
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden space-y-4">
          <div className="h-4 w-20 bg-muted rounded shimmer-bg"></div>
          <div className="h-8 w-16 bg-muted rounded shimmer-bg"></div>
          <div className="h-4 w-24 bg-muted rounded shimmer-bg"></div>
        </div>
        {/* KPI 4: Comparison */}
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden space-y-4">
          <div className="h-4 w-32 bg-muted rounded shimmer-bg"></div>
          <div className="h-8 w-24 bg-muted rounded shimmer-bg"></div>
          <div className="h-4 w-28 bg-muted rounded shimmer-bg"></div>
        </div>
      </div>

      {/* Main Charts & Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Big Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 relative overflow-hidden space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-muted rounded shimmer-bg"></div>
            <div className="h-8 w-44 bg-muted rounded-xl shimmer-bg"></div>
          </div>
          <div className="h-[320px] w-full bg-muted rounded-2xl shimmer-bg opacity-30"></div>
        </div>
        {/* Right Column: Breakdown Pie */}
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden space-y-6 flex flex-col justify-between">
          <div className="h-5 w-40 bg-muted rounded shimmer-bg"></div>
          {/* Shimmering Pie Graphic */}
          <div className="h-44 w-44 bg-muted rounded-full shimmer-bg opacity-20 mx-auto relative flex items-center justify-center">
            <div className="w-24 h-24 bg-card rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded shimmer-bg"></div>
            <div className="h-4 w-5/6 bg-muted rounded shimmer-bg"></div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function Dashboard({ triggerToast, refreshProfile }: DashboardProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Timeframe and interactive legend filters
  const [timeframe, setTimeframe] = useState<'7' | '30' | 'all'>('7');
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // EcoGuide AI coach floating state
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachInput, setCoachInput] = useState('');
  const [coachMessages, setCoachMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: "Hello! I am EcoGuide AI, your sustainability coach. I've analyzed your daily consumption data. You can save up to 4.2 kg CO₂/day by walking on short trips. What would you like to target today?" }
  ]);
  const [coachLoading, setCoachLoading] = useState(false);

  // Fetch carbon analytics
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['carbonStats'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/entries/stats`, { headers });
      return res.data.data;
    }
  });

  // Fetch AI Carbon Forecast & anomalies
  const { data: forecast = null } = useQuery({
    queryKey: ['aiForecast'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/ai/forecast`, { headers });
      return res.data.data;
    }
  });

  // Fetch Streaks
  const { data: streaks = null } = useQuery({
    queryKey: ['userStreaks'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/collectibles/streaks`, { headers });
      return res.data.data;
    }
  });

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/reports/pdf`, {
        headers,
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `ecotrack-report-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      triggerToast('PDF Report generated and downloaded successfully!', 'success');
      refreshProfile();
    } catch (err: any) {
      console.error(err);
      triggerToast('Failed to generate PDF report. Please try again.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/reports/csv`, {
        headers,
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `ecotrack-entries-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      triggerToast('CSV Data exported successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast('Failed to export CSV data. Please try again.', 'error');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const askCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim() || coachLoading) return;

    const userText = coachInput;
    setCoachMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setCoachInput('');
    setCoachLoading(true);

    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${BACKEND_URL}/ai/recommendations`, {
        question: userText
      }, { headers });

      if (res.data.success) {
        setCoachMessages(prev => [...prev, { sender: 'ai', text: res.data.data.response }]);
      }
    } catch (err) {
      console.error(err);
      setCoachMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, I'm having trouble connecting to the analytics node. Please try again." }]);
    } finally {
      setCoachLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center shadow-lg max-w-2xl mx-auto my-12 backdrop-blur-md">
        <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 mb-4 border border-rose-500/20">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Failed to Load Dashboard Stats</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
          {error instanceof Error ? error.message : 'A network error occurred while contacting the server.'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          Retry Connection
        </button>
      </div>
    );
  }

  if (stats?.empty) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-3xl text-center shadow-xl max-w-3xl mx-auto my-6 relative overflow-hidden fade-in">
        {/* Soft Organic Background Blur */}
        <div className="absolute -top-16 -left-16 w-52 h-52 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="inline-flex p-4 bg-primary/10 rounded-2xl text-primary mb-6 border border-primary/20 shadow-md">
          <Activity className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">
          Start Your Sustainability Journey
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md text-xs font-medium leading-relaxed">
          No carbon logs recorded yet. Track your daily commute, home utility use, diet, and lifestyle to unlock dynamic metrics, predictions, and personal AI guidance.
        </p>
        <button
          onClick={() => {
            const sidebarBtn = document.querySelector('nav button:nth-child(2)') as HTMLButtonElement;
            if (sidebarBtn) sidebarBtn.click();
          }}
          className="bg-primary hover:bg-primary/95 text-primary-foreground px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 text-xs"
        >
          <Sparkles className="w-4.5 h-4.5" />
          Calculate Footprint
        </button>
      </div>
    );
  }

  const toggleCategory = (category: string) => {
    setHiddenCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const filteredTrends = stats?.trends ? (
    timeframe === '7' ? stats.trends.slice(-7) : 
    timeframe === '30' ? stats.trends.slice(-30) : 
    stats.trends
  ) : [];

  const categoryMap = [
    { key: 'transport', name: 'Transport', color: '#166534', value: stats.breakdown.transport },
    { key: 'electricity', name: 'Electricity', color: '#84CC16', value: stats.breakdown.electricity },
    { key: 'food', name: 'Diet', color: '#10B981', value: stats.breakdown.food },
    { key: 'shopping', name: 'Shopping', color: '#8B5E3C', value: stats.breakdown.shopping },
    { key: 'waste', name: 'Waste', color: '#38BDF8', value: stats.breakdown.waste },
  ];

  const pieData = categoryMap
    .filter(c => c.value > 0)
    .map(c => ({ name: c.name, value: c.value, color: c.color }));

  const getScoreRating = (s: number) => {
    if (s >= 80) return { label: 'Excellent', emoji: '🌱 Your ecosystem is thriving', style: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (s >= 50) return { label: 'Good', emoji: '🌿 Keep planting seeds of change', style: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Needs Action', emoji: '⚠️ Action needed to restore ecosystem health', style: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const scoreRating = getScoreRating(stats.score);

  // Circular score gauge calculations
  const radius = 52;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(stats.score, 100) / 100) * circumference;

  // Equivalents calculations
  const co2 = stats.totalCO2;
  const kmDriven = (co2 * 5.0).toFixed(0);
  const treesNeeded = (co2 / 22.0).toFixed(1);
  const smartphoneHours = (co2 * 115).toFixed(0);

  // Math savings vs national average
  const carbonSaved = Math.max(0, stats.community.nationalAvg - stats.avgCO2);
  const reductionPercentage = Math.min(100, Math.max(0, ((stats.community.nationalAvg - stats.avgCO2) / stats.community.nationalAvg) * 100));

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getActiveEvent = () => {
    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (month === 4 && day === 22) return { name: 'Earth Day', desc: 'Global sustainability mission activated! Let\'s restore our planet.', theme: 'spring' };
    if (month === 6) return { name: 'World Environment Day Events', desc: 'June Climate Campaign Active! Earn double XP for community missions.', theme: 'summer' };
    if (month === 3 && day === 22) return { name: 'World Water Day', desc: 'Conserve water & protect our shared hydrological ecosystems.', theme: 'spring' };
    if (month === 12) return { name: 'Energy Conservation Week', desc: 'Minimize power usage & offset carbon grids.', theme: 'winter' };
    return null;
  };
  const activeEvent = getActiveEvent();


  // Growing Ecosystem vector tree rendering
  const renderGrowingEcosystem = (points: number) => {
    let stageName = 'Seed';
    let emoji = '🌱';
    let description = 'Ecosystem is taking root. Log daily actions to sprout!';
    let svgContent = null;
    
    if (points < 100) {
      stageName = 'Seed';
      emoji = '🌱';
      description = 'Ecosystem is taking root. Log daily actions to sprout!';
      svgContent = (
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          <circle cx="50" cy="80" r="4.5" fill="#8B5E3C" />
          <path d="M50,80 Q48,70 50,60" stroke="#166534" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M50,60 Q45,55 42,57" stroke="#166534" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M42,57 C40,54 44,52 46,55" fill="#84CC16" />
        </svg>
      );
    } else if (points < 500) {
      stageName = 'Sprout';
      emoji = '🌿';
      description = 'Your sprout is growing leaves! Continue reduction logs.';
      svgContent = (
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          <path d="M50,85 Q47,65 50,45" stroke="#166534" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M50,65 Q42,55 35,58" stroke="#166534" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M35,58 C32,55 38,50 42,55" fill="#10B981" />
          <path d="M50,55 Q58,45 65,48" stroke="#166534" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M65,48 C68,45 62,40 58,45" fill="#84CC16" />
        </svg>
      );
    } else if (points < 1500) {
      stageName = 'Plant';
      emoji = '🌲';
      description = 'A sturdy plant is branching out. Your efforts are paying off!';
      svgContent = (
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          <path d="M50,90 Q48,65 50,32" stroke="#8B5E3C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M50,65 Q35,55 25,60" stroke="#8B5E3C" strokeWidth="2" fill="none" />
          <path d="M25,60 C20,55 28,45 35,55" fill="#10B981" />
          <path d="M50,50 Q65,40 75,45" stroke="#8B5E3C" strokeWidth="2" fill="none" />
          <path d="M75,45 C80,40 72,30 65,40" fill="#166534" />
          <path d="M50,35 Q40,25 35,30" stroke="#8B5E3C" strokeWidth="2" fill="none" />
          <path d="M35,30 C30,25 38,15 42,25" fill="#84CC16" />
        </svg>
      );
    } else if (points < 3000) {
      stageName = 'Tree';
      emoji = '🌳';
      description = 'A majestic mature tree! You are a pillars of sustainability.';
      svgContent = (
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          <path d="M50,90 L50,45" stroke="#8B5E3C" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M48,90 L44,95" stroke="#8B5E3C" strokeWidth="3.5" />
          <path d="M52,90 L56,95" stroke="#8B5E3C" strokeWidth="3.5" />
          <circle cx="50" cy="35" r="23" fill="#166534" opacity="0.9" />
          <circle cx="38" cy="40" r="17" fill="#10B981" opacity="0.85" />
          <circle cx="62" cy="40" r="17" fill="#84CC16" opacity="0.85" />
          <circle cx="50" cy="22" r="15" fill="#84CC16" opacity="0.95" />
        </svg>
      );
    } else {
      stageName = 'Forest';
      emoji = '🌎';
      description = 'A lush visual forest! You are saving the planet and leading the community!';
      svgContent = (
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          <path d="M28,90 L28,62" stroke="#8B5E3C" strokeWidth="4" />
          <circle cx="28" cy="50" r="13" fill="#166534" />
          <path d="M72,90 L72,62" stroke="#8B5E3C" strokeWidth="4" />
          <circle cx="72" cy="50" r="13" fill="#84CC16" />
          <path d="M50,90 L50,44" stroke="#8B5E3C" strokeWidth="5.5" />
          <circle cx="50" cy="32" r="16" fill="#10B981" />
        </svg>
      );
    }

    return (
      <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between items-center text-center shadow-sm relative overflow-hidden h-full">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent to-secondary"></div>
        <div className="w-full">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
            Growing Ecosystem Journey
          </span>
          <div className="flex justify-center items-center my-5 transition-all transform hover:scale-105 duration-300">
            {svgContent}
          </div>
        </div>
        <div>
          <span className="text-xs font-black text-foreground uppercase tracking-wider block">
            {emoji} {stageName} Stage
          </span>
          <p className="text-[10px] text-muted-foreground font-semibold mt-2.5 max-w-[200px] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 fade-in relative">
      
      {/* Greeting Banner */}
      <div className="bg-card p-6 border border-border rounded-3xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            {getGreeting()}, User
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Review your health indices, ecosystem growth, and reduction projections.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="flex items-center gap-2 bg-muted hover:bg-border disabled:opacity-50 text-foreground border border-border rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {downloadingCsv ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
            )}
            Export CSV
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 disabled:opacity-50 text-primary-foreground rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            {downloadingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download PDF Report
          </button>
        </div>
      </div>

      {/* 2.5 STREAKS & SEASONAL NOTIFICATION ROW */}
      <div className="space-y-4">
        {/* Seasonal event */}
        {activeEvent && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4.5 rounded-3xl flex items-center gap-3.5 shadow-sm text-xs font-semibold animate-pulse">
            <span className="text-xl">🌍</span>
            <div>
              <strong className="block text-foreground font-black">{activeEvent.name} Active</strong>
              <span className="text-[11px] text-muted-foreground mt-0.5">{activeEvent.desc}</span>
            </div>
          </div>
        )}

        {/* Anomaly Alerts */}
        {forecast?.anomalies && forecast.anomalies.map((anom: any, idx: number) => (
          <div key={idx} className="bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 p-4.5 rounded-3xl flex items-center gap-3.5 shadow-sm text-xs font-semibold">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="block text-foreground font-black">Emissions Outlier</strong>
              <span className="text-[11px] text-muted-foreground mt-0.5">{anom.message}</span>
            </div>
          </div>
        ))}

        {/* Streaks Widget */}
        {streaks && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-card border border-border p-5 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary to-accent"></div>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Daily Streak</span>
                <span className="text-xs font-black text-foreground">{streaks.dailyStreak} days</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-border/60 pl-4">
              <span className="text-2xl">🌟</span>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Missions Run</span>
                <span className="text-xs font-black text-foreground">{streaks.challengeStreak} done</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-border/60 pl-4">
              <span className="text-2xl">📉</span>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Cut Streak</span>
                <span className="text-xs font-black text-foreground">{streaks.emissionStreak} logs</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-border/60 pl-4">
              <span className="text-2xl">🤝</span>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Community</span>
                <span className="text-xs font-black text-foreground">Active</span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* 3-Column Top Section: Score, Growing Tree, Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Col 1: Today's Eco Health Score circular gauge */}
        <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between items-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-primary"></div>
          
          <div className="text-center w-full">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
              Today's Eco Health Score
            </span>
            <div className="flex justify-center items-center mt-6 relative w-36 h-36 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="progress-radial-track"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="url(#dashboardHealthScoreGrad)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="dashboardHealthScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#166534" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black text-foreground tracking-tighter">{stats.score}</h1>
                <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest">Score / 100</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className={`text-[10px] font-bold px-3.5 py-1 rounded-full border ${scoreRating.style}`}>
              {scoreRating.label} Rating
            </span>
            <p className="text-[10px] text-muted-foreground font-semibold mt-3.5">
              {scoreRating.emoji}
            </p>
          </div>
        </div>

        {/* Col 2: Growing Ecosystem Tree */}
        <div>
          {renderGrowingEcosystem(stats.trends.length * 50)} {/* points based scale */}
        </div>

        {/* Col 3: Carbon Reduction Journey Roadmap */}
        <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary to-primary"></div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">
              Impact Journey Roadmap
            </span>
            
            <div className="relative pl-6 border-l border-dashed border-border/80 space-y-4.5">
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center text-[8px] text-white">1</span>
                <div>
                  <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    Logged Avg: {stats.avgCO2.toFixed(1)} kg
                  </h4>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">Primary emissions stem from {stats.breakdown.transport > stats.breakdown.electricity ? 'Transportation' : 'Utilities'}.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-primary border-2 border-background flex items-center justify-center text-[8px] text-white">2</span>
                <div>
                  <h4 className="text-xs font-extrabold text-foreground">Active Missions</h4>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">Toggle energy reductions or short walking commutes to save CO₂.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-[8px] text-white">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-foreground">Regrowth Forest</h4>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">Log consistently to plant your tree inside the Community Forest.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={() => setCoachOpen(true)}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary rounded-xl py-2.5 text-[10px] font-extrabold transition-all cursor-pointer text-center"
            >
              Consult EcoGuide AI coach
            </button>
          </div>
        </div>

      </div>

      {/* 4. Glassmorphic Impact Overview widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Item 1: Carbon Emissions */}
        <div className="premium-glass border border-border p-5 rounded-3xl shadow-sm relative overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Emissions logged</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h2 className="text-2xl font-black text-foreground tracking-tighter">{stats.totalCO2.toFixed(1)}</h2>
            <span className="text-[10px] font-bold text-muted-foreground">kg CO₂e</span>
          </div>
        </div>

        {/* Item 2: Carbon Saved */}
        <div className="premium-glass border border-border p-5 rounded-3xl shadow-sm relative overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Carbon Saved</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h2 className="text-2xl font-black text-primary tracking-tighter">+{carbonSaved.toFixed(1)}</h2>
            <span className="text-[10px] font-bold text-primary">kg saved</span>
          </div>
        </div>

        {/* Item 3: Trees Equivalent */}
        <div className="premium-glass border border-border p-5 rounded-3xl shadow-sm relative overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Tree Equivalent</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h2 className="text-2xl font-black text-foreground tracking-tighter">{treesNeeded}</h2>
            <span className="text-[10px] font-bold text-muted-foreground">Trees offset</span>
          </div>
        </div>

        {/* Item 4: Reduction % */}
        <div className="premium-glass border border-border p-5 rounded-3xl shadow-sm relative overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Reduction Ratio</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h2 className="text-2xl font-black text-secondary tracking-tighter">{reductionPercentage.toFixed(0)}%</h2>
            <span className="text-[10px] font-bold text-secondary">Vs National Avg</span>
          </div>
        </div>

      </div>

      {/* 5. Carbon Analytics charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Stacked emission trend chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-foreground mb-1 text-sm">Carbon Analytics</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Nature-themed emission tracking parameters.</p>
            </div>
            
            {/* Timeframes */}
            <div className="flex gap-1.5 bg-muted p-1 rounded-xl border border-border">
              {(['7', '30', 'all'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                    timeframe === t 
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === '7' ? '7 Logs' : t === '30' ? '30 Logs' : 'All Logs'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Legend filter buttons */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            {categoryMap.map(c => {
              const isHidden = hiddenCategories.includes(c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => toggleCategory(c.key)}
                  className={`btn-choice flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer ${
                    isHidden 
                      ? 'border-border bg-muted/40 text-muted-foreground line-through'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isHidden ? '#9CA3AF' : c.color }} />
                  {c.name}
                </button>
              );
            })}
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(224, 232, 220, 0.2)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '16px' }} 
                  itemStyle={{ fontSize: '10px' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                {categoryMap.map(c => !hiddenCategories.includes(c.key) && (
                  <Bar key={c.key} dataKey={c.key} stackId="a" fill={c.color} name={c.name} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Distribution Pie Chart */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-secondary"></div>
          <div>
            <h3 className="font-extrabold text-foreground mb-1 text-sm">Source share</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Percentage weight mapped per carbon category</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-xs text-muted-foreground">No distribution logged</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Color Indicators Legend */}
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 mt-2">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Projections & Equivalents details row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Col 1 & 2: Projections */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden lg:col-span-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-500"></div>
          <div>
            <h3 className="font-extrabold text-foreground mb-1 text-sm">Emissions Forecasting Scenarios</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Visual projections comparing your Status Quo vs Sustainable Action pathway (in kg CO₂e).</p>
          </div>

          <div className="h-64 w-full mt-6">
            {forecast?.hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Monthly CO₂', 'Status Quo': forecast.projections.statusQuoMonth, 'Sustainable Path': forecast.projections.sustainableMonth },
                  { name: 'Yearly CO₂', 'Status Quo': forecast.projections.statusQuoYear, 'Sustainable Path': forecast.projections.sustainableYear }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(224, 232, 220, 0.2)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '10px' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Status Quo" fill="#EF4444" name="Status Quo (No Change)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sustainable Path" fill="#10B981" name="Sustainable Path (-35% Target)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground font-semibold">
                Please log entries to compile carbon projections
              </div>
            )}
          </div>
          
          {forecast?.scenarioText && (
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed mt-4 bg-muted/40 p-3 rounded-2xl border border-border/80">
              💡 <strong>AI Scenario Insight:</strong> {forecast.scenarioText}
            </p>
          )}
        </div>

        {/* Col 3: Real world equivalents */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-secondary"></div>
          <div>
            <h3 className="font-extrabold text-foreground mb-1 text-sm">Impact Equivalents</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Real-world equivalents of logged carbon footprint.</p>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border">
              <div className="p-2 bg-sky-500/10 text-sky-500 rounded-xl">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">{kmDriven} km</h4>
                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Driving equivalent</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">{treesNeeded} Trees</h4>
                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Required to offset yearly</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">{smartphoneHours} hours</h4>
                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Smartphone charging</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Slide-over floating EcoGuide AI Coach Panel */}
      <AnimatePresence>
        {coachOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setCoachOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full max-w-md bg-card border-l border-border h-full flex flex-col justify-between relative shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">EcoGuide AI</h3>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Sustainability Coach</p>
                  </div>
                </div>
                <button
                  onClick={() => setCoachOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all cursor-pointer border border-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {coachMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm">
                        <Compass className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground font-bold rounded-tr-none'
                        : 'bg-muted border border-border text-foreground rounded-tl-none font-semibold'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {coachLoading && (
                  <div className="flex gap-3 justify-start animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 animate-spin">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="bg-muted border border-border rounded-2xl p-4 w-40 rounded-tl-none">
                      <div className="h-2 bg-border rounded w-full mb-1"></div>
                      <div className="h-2 bg-border rounded w-5/6"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-muted/20">
                <form onSubmit={askCoach} className="flex gap-3.5">
                  <input
                    type="text"
                    value={coachInput}
                    onChange={(e) => setCoachInput(e.target.value)}
                    placeholder="Ask how to reduce transport, home utilities..."
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder-muted-foreground/35"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl px-4.5 py-2.5 text-xs flex items-center justify-center"
                  >
                    Send
                  </button>
                </form>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Generation concentric rings loader overlay */}
      <AnimatePresence>
        {downloadingPdf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card border border-border max-w-sm w-full rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              {/* Concentric Tree Rings Spinner */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full ring-rotate absolute top-0 left-0">
                  <circle cx="50" cy="50" r="45" stroke="var(--primary)" strokeWidth="1" strokeDasharray="6 4" fill="none" className="opacity-30" />
                  <circle cx="50" cy="50" r="35" stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="8 6" fill="none" className="opacity-50" />
                  <circle cx="50" cy="50" r="25" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 8" fill="none" className="opacity-70" />
                  <circle cx="50" cy="50" r="15" stroke="var(--primary)" strokeWidth="2.5" fill="none" className="opacity-90" />
                </svg>
                <div className="z-10 text-primary">
                  <Trees className="w-8 h-8 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-black text-foreground">Generating Eco Report</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                  Compiling your carbon footprint entries and drawing environmental progress rings...
                </p>
              </div>

              {/* Progress Bar Animation */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.5, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
