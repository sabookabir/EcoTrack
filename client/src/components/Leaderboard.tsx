import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  Trophy, 
  School, 
  MapPin, 
  ChevronRight, 
  RefreshCw,
  AlertTriangle,
  Award,
  Trees,
  Activity,
  Globe,
  Compass,
  Zap,
  Leaf,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardUser {
  id: string;
  full_name: string | null;
  college_name: string | null;
  city: string | null;
  points: number;
}

interface LeaderboardCollege {
  college_name: string;
  avg_points: number;
  user_count: number;
}

interface UserRanking {
  globalRank: number;
  totalUsersGlobal: number;
  collegeRank: number | null;
  totalUsersCollege: number;
  points: number;
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Community Forest Canvas Loading Wrapper */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-500/5 via-muted/40 to-emerald-900/5 border border-border rounded-3xl p-8 flex flex-col items-center justify-center min-h-[320px] shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-accent opacity-30"></div>
        {/* Scrolling fog layers */}
        <div className="absolute inset-0 pointer-events-none opacity-40 select-none z-10 mix-blend-overlay">
          <div className="absolute w-[200%] h-full top-0 left-0 bg-repeat-x fog-scrolling" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='200' viewBox='0 0 1000 200'%3E%3Cpath d='M0,150 Q120,80 250,130 T500,100 T750,150 T1000,120 L1000,200 L0,200 Z' fill='%23ffffff' opacity='0.25'/%3E%3C/svg%3E")` }}></div>
          <div className="absolute w-[200%] h-full top-0 left-0 bg-repeat-x fog-scrolling" style={{ animationDirection: 'reverse', animationDuration: '40s', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='200' viewBox='0 0 1000 200'%3E%3Cpath d='M0,130 Q150,60 300,110 T600,90 T900,140 T1000,110 L1000,200 L0,200 Z' fill='%23ebf1e7' opacity='0.3'/%3E%3C/svg%3E")` }}></div>
        </div>

        {/* Small growing sapling placeholders */}
        <div className="flex justify-center gap-12 z-0 my-6">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [0.9, 1.05, 0.9], y: [0, -3, 0] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center opacity-60"
            >
              <svg viewBox="0 0 100 100" className="w-14 h-14">
                <ellipse cx="50" cy="85" rx="20" ry="3" fill="#8B5E3C" opacity="0.4" />
                <path d="M50,85 Q46,70 52,60" stroke="#10B981" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                <path d="M52,60 Q57,55 60,58 Q56,62 52,60" fill="#84CC16" />
                <path d="M50,70 Q44,66 42,69 Q46,71 50,70" fill="#10B981" />
              </svg>
              <span className="text-[9px] font-extrabold text-muted-foreground mt-2.5 uppercase tracking-widest">Sprouting...</span>
            </motion.div>
          ))}
        </div>

        <div className="text-center z-20 space-y-2 max-w-sm mt-4">
          <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Growing Digital Forest
          </h4>
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
            Nurturing community saplings and gathering environmental coordinate points...
          </p>
        </div>
      </div>

      {/* Main Leaderboard List Shimmer */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div className="h-5 w-36 bg-muted rounded shimmer-bg"></div>
          <div className="flex gap-2 bg-muted p-1 rounded-xl">
            <div className="h-8 w-20 bg-card rounded-lg"></div>
            <div className="h-8 w-20 bg-transparent rounded-lg"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-muted rounded-xl shimmer-bg flex-shrink-0"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded shimmer-bg"></div>
                  <div className="h-3 w-48 bg-muted rounded shimmer-bg"></div>
                </div>
              </div>
              <div className="h-6 w-16 bg-muted rounded shimmer-bg"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [activeSubTab, setActiveSubTab] = useState<'global' | 'colleges'>('global');
  const [hoveredUser, setHoveredUser] = useState<LeaderboardUser | null>(null);

  // Fetch leaderboard data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leaderboardData'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/leaderboard`, { headers });
      return res.data.data as {
        global: LeaderboardUser[];
        colleges: LeaderboardCollege[];
        userRanking: UserRanking;
      };
    }
  });

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-3xl text-center shadow-md max-w-xl mx-auto my-12 fade-in">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold mb-1">Failed to Load Leaderboards</h3>
        <p className="text-xs text-muted-foreground mb-6">
          {error instanceof Error ? error.message : 'Network error occurred.'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const globalRankings = data?.global || [];
  const collegeRankings = data?.colleges || [];
  const userRank = data?.userRanking;

  // Calculate dynamic collective community metrics
  const totalUsers = globalRankings.length;
  const collectivePoints = globalRankings.reduce((sum, u) => sum + (u.points || 0), 0);
  const collectiveCO2Saved = (collectivePoints * 0.15).toFixed(0); // 1 XP = 0.15kg CO2 saved factor
  const collectiveTreesSaved = (Number(collectiveCO2Saved) / 22.0).toFixed(0); // 22kg CO2 per tree per year

  // Tree Stage helper for digital forest
  const getTreeType = (points: number) => {
    if (points < 100) return { name: 'Seedling', emoji: '🌱' };
    if (points < 500) return { name: 'Sapling', emoji: '🌿' };
    if (points < 1500) return { name: 'Young Tree', emoji: '🌲' };
    return { name: 'Ancient Canopy', emoji: '🌳' };
  };

  const renderForestTreeSVG = (points: number) => {
    if (points < 100) {
      // Sprout
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110">
          <path d="M50,85 Q47,65 50,55" stroke="#166534" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M50,70 Q42,60 38,63" stroke="#166534" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M38,63 C35,60 40,56 44,60" fill="#10B981" />
        </svg>
      );
    } else if (points < 500) {
      // Sapling / Plant
      return (
        <svg viewBox="0 0 100 100" className="w-11 h-11 transition-transform duration-300 group-hover:scale-110">
          <path d="M50,90 Q48,65 50,45" stroke="#8B5E3C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M50,65 Q35,55 28,60" stroke="#8B5E3C" strokeWidth="2.2" fill="none" />
          <path d="M28,60 C24,55 30,48 36,55" fill="#10B981" />
          <path d="M50,55 Q62,45 68,50" stroke="#8B5E3C" strokeWidth="2.2" fill="none" />
          <path d="M68,50 C72,45 66,38 60,45" fill="#84CC16" />
        </svg>
      );
    } else if (points < 1500) {
      // Medium Tree
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 transition-transform duration-300 group-hover:scale-110">
          <path d="M50,90 L50,52" stroke="#8B5E3C" strokeWidth="6.5" strokeLinecap="round" />
          <circle cx="50" cy="42" r="18" fill="#166534" opacity="0.9" />
          <circle cx="40" cy="47" r="14" fill="#10B981" opacity="0.85" />
          <circle cx="60" cy="47" r="14" fill="#84CC16" opacity="0.85" />
        </svg>
      );
    } else {
      // Large Golden Canopy
      return (
        <svg viewBox="0 0 100 100" className="w-14 h-14 transition-transform duration-300 group-hover:scale-115">
          <path d="M50,90 L50,48" stroke="#8B5E3C" strokeWidth="7" strokeLinecap="round" />
          <path d="M48,90 L42,95" stroke="#8B5E3C" strokeWidth="4" />
          <path d="M52,90 L58,95" stroke="#8B5E3C" strokeWidth="4" />
          <circle cx="50" cy="38" r="22" fill="#15803D" />
          <circle cx="36" cy="42" r="16" fill="#10B981" />
          <circle cx="64" cy="42" r="16" fill="#84CC16" />
          <circle cx="50" cy="24" r="14" fill="#F59E0B" opacity="0.95" />
        </svg>
      );
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto fade-in">
      
      {/* 1. COMMUNITY FOREST CANVAS */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-accent animate-gradient"></div>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Trees className="w-5 h-5 text-primary" />
              The Community Forest
            </h2>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Every member contributes a growing tree based on their logged carbon offset XP.</p>
          </div>
          
          {/* Forest Legend */}
          <div className="flex flex-wrap gap-2 text-[9px] font-bold text-muted-foreground bg-muted/40 p-2 rounded-2xl border border-border">
            <span className="flex items-center gap-1">🌱 Seedling</span>
            <span className="flex items-center gap-1">🌿 Sapling</span>
            <span className="flex items-center gap-1">🌲 Young Tree</span>
            <span className="flex items-center gap-1">🌳 Ancient Canopy</span>
          </div>
        </div>

        {/* Forest Grid Canvas */}
        <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/15 rounded-2xl p-6 min-h-[200px] flex flex-wrap justify-center items-end gap-6 relative shadow-inner">
          {globalRankings.slice(0, 16).map((user, idx) => {
            const tree = getTreeType(user.points);
            const rankLabel = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return (
              <div 
                key={user.id}
                onMouseEnter={() => setHoveredUser(user)}
                onMouseLeave={() => setHoveredUser(null)}
                className="group relative cursor-pointer flex flex-col items-center justify-end h-20 w-16"
              >
                {/* Wind sway animation wrapper on hover */}
                <div className="transform group-hover:rotate-3 transition-transform duration-300 origin-bottom flex items-end justify-center h-full">
                  {renderForestTreeSVG(user.points)}
                </div>

                <span className="text-[8px] font-extrabold text-muted-foreground/80 mt-1.5 uppercase truncate w-full text-center">
                  {user.full_name?.split(' ')[0] || 'Member'}
                </span>

                {/* Floating CSS Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-2 z-20 w-44 bg-card border border-border rounded-2xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary font-mono">{tree.name}</span>
                    <span className="text-[10px] font-black text-foreground">{rankLabel}</span>
                  </div>
                  <h4 className="text-xs font-black text-foreground truncate">{user.full_name || 'Anonymous Member'}</h4>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5 truncate flex items-center gap-1">
                    <School className="w-3 h-3 text-muted-foreground/75" />
                    {user.college_name || 'Individual'}
                  </p>
                  
                  <div className="mt-2 pt-1.5 border-t border-border flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-emerald-600">🌱 +{user.points} XP</span>
                    <span className="text-muted-foreground font-semibold">{(user.points * 0.15).toFixed(0)}kg CO₂ saved</span>
                  </div>
                </div>
              </div>
            );
          })}

          {globalRankings.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground font-semibold text-xs">
              <Info className="w-6 h-6 text-emerald-500/60 mb-2" />
              Your forest is empty. Start calculating carbon logs to plant the first tree!
            </div>
          )}
        </div>
      </div>

      {/* 2. COMMUNITY IMPACT STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        
        {/* Metric 1 */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/15">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Collective Members</span>
            <h3 className="text-xl font-black text-foreground mt-0.5">{totalUsers} Growers</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center gap-3.5 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
          <div className="p-3 bg-secondary/10 rounded-2xl text-secondary border border-secondary/15">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">CO₂ Saved Together</span>
            <h3 className="text-xl font-black text-foreground mt-0.5">{collectiveCO2Saved} kg</h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center gap-3.5 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
          <div className="p-3 bg-accent/10 rounded-2xl text-accent border border-accent/15">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Dynamic Trees Saved</span>
            <h3 className="text-xl font-black text-foreground mt-0.5">{collectiveTreesSaved} saved</h3>
          </div>
        </div>
      </div>

      {/* 3. YOUR POSITION STANDING CARDS */}
      {userRank && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>

          {/* Global standing */}
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Global standing</span>
              <h3 className="text-lg font-black text-foreground mt-0.5">
                #{userRank.globalRank} <span className="text-xs text-muted-foreground font-medium">of {userRank.totalUsersGlobal}</span>
              </h3>
            </div>
          </div>

          {/* Campus standing */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            <div className="p-3.5 bg-secondary/10 rounded-2xl text-secondary border border-secondary/20">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Campus standing</span>
              <h3 className="text-lg font-black text-foreground mt-0.5">
                {userRank.collegeRank ? `#${userRank.collegeRank}` : 'N/A'}{' '}
                <span className="text-xs text-muted-foreground font-medium">of {userRank.totalUsersCollege}</span>
              </h3>
            </div>
          </div>

          {/* Points Standings */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            <div className="p-3.5 bg-accent/10 rounded-2xl text-accent border border-accent/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Total Earned</span>
              <h3 className="text-lg font-black text-foreground mt-0.5">
                {userRank.points} <span className="text-xs text-muted-foreground font-semibold">XP Points</span>
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBTAB SELECTOR & RANKINGS TABLE */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Subtab selection Bar */}
        <div className="border-b border-border px-6 py-4 flex gap-3.5 bg-muted/40">
          <button
            onClick={() => setActiveSubTab('global')}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeSubTab === 'global'
                ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Global Eco Users
          </button>
          <button
            onClick={() => setActiveSubTab('colleges')}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeSubTab === 'colleges'
                ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Campus Standings
          </button>
        </div>

        {/* Table layouts */}
        <div className="overflow-x-auto">
          {activeSubTab === 'global' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-6">Participant</th>
                  <th className="py-3.5 px-6"><span className="flex items-center gap-1.5"><School className="w-3.5 h-3.5" /> Campus</span></th>
                  <th className="py-3.5 px-6"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</span></th>
                  <th className="py-3.5 px-6 text-right w-28">Eco Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-muted-foreground">
                {globalRankings.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-4 px-6 text-center font-extrabold text-foreground">
                      {idx === 0 && '🥇'}
                      {idx === 1 && '🥈'}
                      {idx === 2 && '🥉'}
                      {idx > 2 && `#${idx + 1}`}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-foreground">
                      {user.full_name || 'Anonymous User'}
                    </td>
                    <td className="py-4 px-6 font-semibold">{user.college_name || 'N/A'}</td>
                    <td className="py-4 px-6 font-semibold">{user.city || 'N/A'}</td>
                    <td className="py-4 px-6 text-right font-black text-primary">
                      {user.points} XP
                    </td>
                  </tr>
                ))}
                {globalRankings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground font-semibold">
                      No eco members logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-6">College / University</th>
                  <th className="py-3.5 px-6 w-32 text-center">Campus size</th>
                  <th className="py-3.5 px-6 text-right w-32">Campus Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-muted-foreground">
                {collegeRankings.map((college, idx) => (
                  <tr key={idx} className="hover:bg-muted/15 transition-colors">
                    <td className="py-4 px-6 text-center font-extrabold text-foreground">
                      {idx === 0 && '🥇'}
                      {idx === 1 && '🥈'}
                      {idx === 2 && '🥉'}
                      {idx > 2 && `#${idx + 1}`}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-foreground flex items-center gap-2">
                      <School className="w-4 h-4 text-muted-foreground" />
                      {college.college_name}
                    </td>
                    <td className="py-4 px-6 text-center font-bold">
                      {college.user_count}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-primary">
                      {college.avg_points} XP
                    </td>
                  </tr>
                ))}
                {collegeRankings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground font-semibold">
                      No campus listings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
