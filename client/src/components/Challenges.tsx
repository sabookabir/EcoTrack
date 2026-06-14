import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Award,
  Lock,
  Play,
  RotateCw,
  AlertCircle,
  Shield,
  Compass,
  Zap,
  Leaf,
  Layers,
  Sparkle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  duration_days: number;
  category: string;
  status: 'not_started' | 'active' | 'completed';
  started_at: string | null;
  completed_at: string | null;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_url: string;
  points_required: number;
  unlocked: boolean;
}

interface ChallengesProps {
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshProfile: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export default function Challenges({ triggerToast, refreshProfile }: ChallengesProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Fetch challenges & achievements
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['challengesList'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/challenges`, { headers });
      return res.data.data as { challenges: Challenge[]; achievements: Achievement[] };
    }
  });

  // Join Challenge Handler
  const handleJoin = async (id: string) => {
    setSubmittingId(id);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${BACKEND_URL}/challenges/join/${id}`, {}, { headers });
      if (res.data.success) {
        triggerToast(res.data.message || 'Successfully joined challenge!', 'success');
        refetch();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to join challenge.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  // Complete Challenge Handler
  const handleComplete = async (id: string) => {
    setSubmittingId(id);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${BACKEND_URL}/challenges/complete/${id}`, {}, { headers });
      if (res.data.success) {
        triggerToast(res.data.message || 'Challenge completed!', 'success');
        refetch();
        refreshProfile();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to complete challenge.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-3xl text-center shadow-md max-w-xl mx-auto my-12 fade-in">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold mb-1">Failed to Load Eco Missions</h3>
        <p className="text-xs text-muted-foreground mb-6">
          {error instanceof Error ? error.message : 'Server communication lapsed.'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
        >
          <RotateCw className="w-4 h-4 animate-spin-slow" /> Retry
        </button>
      </div>
    );
  }

  const challenges = data?.challenges || [];
  const achievements = data?.achievements || [];

  const getCategoryTheme = (category: string) => {
    const norm = category?.toLowerCase() || '';
    if (norm.includes('trans')) {
      return { color: 'text-sky-600 bg-sky-500/10 border-sky-500/20', icon: Compass };
    } else if (norm.includes('energ')) {
      return { color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Zap };
    } else if (norm.includes('food') || norm.includes('diet')) {
      return { color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', icon: Leaf };
    } else if (norm.includes('waste')) {
      return { color: 'text-rose-600 bg-rose-500/10 border-rose-500/20', icon: Sparkle };
    } else {
      return { color: 'text-primary bg-primary/10 border-primary/20', icon: Sparkles };
    }
  };

  const getChallengeMeta = (points: number) => {
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
    let diffStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    let carbonImpact = 'Low (~5 kg CO₂e saved)';

    if (points >= 200) {
      difficulty = 'Hard';
      diffStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
      carbonImpact = 'High (~25 kg CO₂e saved)';
    } else if (points >= 150) {
      difficulty = 'Medium';
      diffStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      carbonImpact = 'Medium (~12 kg CO₂e saved)';
    }

    return { difficulty, diffStyle, carbonImpact };
  };

  const renderBadgeSVG = (name: string, unlocked: boolean) => {
    const normName = name.toLowerCase();
    if (normName.includes('beginner')) {
      return (
        <svg viewBox="0 0 100 100" className="w-14 h-14">
          <defs>
            <radialGradient id="beg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#166534" stopOpacity="0.0" />
            </radialGradient>
          </defs>
          {unlocked && <circle cx="50" cy="50" r="40" fill="url(#beg-grad)" />}
          <circle cx="50" cy="50" r="32" fill="none" stroke={unlocked ? '#10B981' : '#E4E4E7'} strokeWidth="2" strokeDasharray="3 3" />
          <path d="M50,70 Q48,52 50,35" stroke={unlocked ? '#166534' : '#A1A1AA'} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M50,55 Q38,45 32,48 C30,45 36,40 42,45" fill={unlocked ? '#10B981' : '#A1A1AA'} />
          <path d="M50,45 Q62,35 68,38 C70,35 64,30 58,35" fill={unlocked ? '#84CC16' : '#D4D4D8'} />
        </svg>
      );
    }
    
    if (normName.includes('warrior')) {
      return (
        <svg viewBox="0 0 100 100" className="w-14 h-14">
          <defs>
            <linearGradient id="war-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84CC16" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
          </defs>
          <path d="M50,15 L78,25 V55 C78,72 66,82 50,88 C34,82 22,72 22,55 V25 L50,15 Z" 
            fill="none" 
            stroke={unlocked ? 'url(#war-grad)' : '#D4D4D8'} 
            strokeWidth="3.5" 
            strokeLinejoin="round" 
          />
          <path d="M42,60 Q34,42 42,30 Q46,42 42,60" fill={unlocked ? '#10B981' : '#A1A1AA'} />
          <path d="M58,60 Q66,42 58,30 Q54,42 58,60" fill={unlocked ? '#84CC16' : '#D4D4D8'} />
          <line x1="50" y1="70" x2="50" y2="30" stroke={unlocked ? '#166534' : '#A1A1AA'} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    }
    
    if (normName.includes('champion')) {
      return (
        <svg viewBox="0 0 100 100" className="w-14 h-14">
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="35" fill="none" stroke={unlocked ? 'url(#gold-grad)' : '#D4D4D8'} strokeWidth="3" />
          <circle cx="50" cy="50" r="28" fill="none" stroke={unlocked ? '#D97706' : '#E4E4E7'} strokeWidth="1" strokeDasharray="4 2" />
          <path d="M50,68 L50,42" stroke={unlocked ? '#8B5E3C' : '#A1A1AA'} strokeWidth="4.5" />
          <path d="M50,30 L66,55 H34 Z" fill={unlocked ? '#166534' : '#A1A1AA'} />
          <path d="M50,20 L60,40 H40 Z" fill={unlocked ? '#10B981' : '#D4D4D8'} />
          <polygon points="50,8 53,13 59,13 54,16 56,21 50,18 44,21 46,16 41,13 47,13" fill={unlocked ? '#F59E0B' : '#A1A1AA'} />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 100 100" className="w-14 h-14">
        <circle cx="50" cy="50" r="32" fill="none" stroke={unlocked ? '#10B981' : '#D4D4D8'} strokeWidth="2.5" />
        <path d="M50,70 Q45,50 50,30 Q55,50 50,70" fill={unlocked ? '#10B981' : '#A1A1AA'} />
      </svg>
    );
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      
      {/* 1. Eco Challenges Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-black tracking-tight text-foreground">Active Green Missions</h2>
          <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">Commit to local carbon reducing actions and complete daily objectives.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {challenges.map((chal) => {
            const themeProps = getCategoryTheme(chal.category);
            const CategoryIcon = themeProps.icon;
            const meta = getChallengeMeta(chal.points);
            
            return (
              <motion.div 
                key={chal.id} 
                variants={itemVariants}
                className={`bg-card border rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                  chal.status === 'completed' 
                    ? 'border-emerald-500/30 bg-emerald-500/[0.01]' 
                    : chal.status === 'active'
                      ? 'border-primary/30 bg-primary/[0.01]'
                      : 'border-border hover:border-primary/20'
                }`}
              >
                {/* Badge Status Pill / Active Flame */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  {chal.status === 'completed' && (
                    <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  )}
                  {chal.status === 'active' && (
                    <span className="text-[9px] font-extrabold bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 flex items-center gap-1.5 animate-pulse uppercase tracking-wider">
                      <Flame className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${themeProps.color}`}>
                      <CategoryIcon className="w-3 h-3" />
                      {chal.category}
                    </span>
                    <span className={`inline-flex items-center text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${meta.diffStyle}`}>
                      {meta.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-extrabold text-foreground mb-2 leading-tight pr-20">{chal.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-medium">{chal.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center pt-4 border-t border-border mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" /> Duration: {chal.duration_days} Days
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-primary" /> Offset: {meta.carbonImpact}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3.5">
                    <span className="text-xs font-black text-primary uppercase tracking-wider">🌱 +{chal.points} XP</span>
                    <div>
                      {chal.status === 'not_started' && (
                        <button
                          onClick={() => handleJoin(chal.id)}
                          disabled={submittingId !== null}
                          className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-current" /> Start Mission
                        </button>
                      )}
                      {chal.status === 'active' && (
                        <button
                          onClick={() => handleComplete(chal.id)}
                          disabled={submittingId !== null}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* 2. Achievements Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-black tracking-tight text-foreground">Ecosystem Badges & Milestones</h2>
          <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">Unlock collectible sustainability medals representing global carbon milestones.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {achievements.map((ach) => (
            <motion.div 
              key={ach.id} 
              variants={itemVariants}
              className={`border rounded-3xl p-5 shadow-sm flex items-start gap-4 transition-all duration-300 relative overflow-hidden ${
                ach.unlocked 
                  ? 'border-primary/25 bg-card hover:shadow-md' 
                  : 'border-border bg-muted/30 opacity-70'
              }`}
            >
              {ach.unlocked && (
                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
              )}

              {/* Redesigned Custom SVG Badge Wrapper */}
              <div className="flex-shrink-0 relative">
                {renderBadgeSVG(ach.name, ach.unlocked)}
                {!ach.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                    <Lock className="w-4 h-4 bg-muted/90 p-0.5 rounded-full border border-border" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-foreground mb-1 leading-none flex items-center gap-1">
                  {ach.name}
                  {ach.unlocked && <span className="text-xs">✨</span>}
                </h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5 mb-3 font-medium">{ach.description}</p>
                <div className="text-[9px] font-extrabold tracking-wider uppercase">
                  {ach.unlocked ? (
                    <span className="text-primary font-black">Unlocked Medal</span>
                  ) : (
                    <span className="text-muted-foreground/60">Requires {ach.points_required} XP</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </div>
  );
}
