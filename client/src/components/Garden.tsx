import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  Trees, 
  Sprout, 
  Award, 
  Plus, 
  Users, 
  Check, 
  CheckCircle2, 
  School, 
  Activity, 
  ChevronRight, 
  User, 
  Lock, 
  Trophy, 
  Sparkles,
  Info,
  Layers,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Collectible {
  id: string;
  type: 'tree' | 'plant' | 'forest' | 'card' | 'trophy' | 'artifact';
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  unlockedAt: string;
}

interface CommunityMember {
  id: string;
  name: string;
  email: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  type: 'team' | 'college_group' | 'department' | 'eco_club';
  members: CommunityMember[];
  points: number;
  collegeName: string;
  createdAt: string;
}

interface GardenProps {
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshProfile: () => void;
}

export default function Garden({ triggerToast, refreshProfile }: GardenProps) {
  const [activeSubTab, setActiveSubTab] = useState<'garden' | 'communities'>('garden');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // Modals / Drawer Form States
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamType, setNewTeamType] = useState<'team' | 'college_group' | 'department' | 'eco_club'>('team');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch collectibles
  const { data: collectibles = [], refetch: refetchCollectibles } = useQuery<Collectible[]>({
    queryKey: ['collectiblesList'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/collectibles`, { headers });
      return res.data.data;
    }
  });

  // 2. Fetch communities
  const { data: communities = [], refetch: refetchCommunities } = useQuery<CommunityGroup[]>({
    queryKey: ['communitiesList'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/communities`, { headers });
      return res.data.data;
    }
  });

  // 3. Fetch specific community forest data
  const { data: forestData, isLoading: loadingForest } = useQuery({
    queryKey: ['communityForest', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return null;
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/communities/forest/${selectedTeamId}`, { headers });
      return res.data.data as {
        team: { id: string; name: string; type: string; points: number };
        forest: Array<{ id: string; full_name: string; college_name: string; points: number }>;
      };
    },
    enabled: !!selectedTeamId
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || submitting) return;
    setSubmitting(true);

    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${BACKEND_URL}/communities/create`, {
        name: newTeamName,
        type: newTeamType
      }, { headers });

      if (res.data.success) {
        triggerToast(res.data.message || 'Eco team created!', 'success');
        setNewTeamName('');
        setCreateOpen(false);
        refetchCommunities();
        refetchCollectibles(); // creation triggers collectibles
        refreshProfile();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to create team.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${BACKEND_URL}/communities/join/${id}`, {}, { headers });
      if (res.data.success) {
        triggerToast(res.data.message || 'Joined group successfully!', 'success');
        refetchCommunities();
        refetchCollectibles();
        refreshProfile();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to join group.', 'error');
    }
  };

  const renderCollectibleSVG = (id: string, rarity: string) => {
    let strokeColor = '#10B981'; // Emerald
    if (rarity === 'Rare') strokeColor = '#38BDF8'; // Sky
    if (rarity === 'Epic') strokeColor = '#84CC16'; // Leaf
    if (rarity === 'Legendary') strokeColor = '#F59E0B'; // Amber Gold

    if (id === 'seedling_sprout') {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M50,80 Q48,65 50,50" stroke="#8B5E3C" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M50,55 Q40,45 35,48 C32,45 38,40 42,45" fill="#10B981" />
          <path d="M50,62 Q60,52 65,55 C68,52 62,47 58,52" fill="#84CC16" />
        </svg>
      );
    }

    if (id === 'oak_sapling') {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M50,85 L50,48" stroke="#8B5E3C" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M50,65 Q32,55 26,60 C22,55 28,48 34,54" fill="#10B981" />
          <path d="M50,52 Q68,42 74,48 C78,42 70,35 64,42" fill="#166534" />
        </svg>
      );
    }

    if (id === 'bonsai_tree') {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="2" />
          {/* Pot */}
          <path d="M25,80 H75 L70,88 H30 Z" fill="#4B5563" />
          {/* Trunk */}
          <path d="M50,80 Q35,60 52,48 Q60,40 50,32" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="30" r="14" fill="#15803D" />
          <circle cx="57" cy="46" r="11" fill="#166534" />
          <circle cx="36" cy="58" r="9" fill="#10B981" />
        </svg>
      );
    }

    if (id === 'redwood_sapling') {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M50,85 L50,38" stroke="#78350F" strokeWidth="7" strokeLinecap="round" />
          <path d="M48,85 L40,92" stroke="#78350F" strokeWidth="4.5" />
          <path d="M52,85 L60,92" stroke="#78350F" strokeWidth="4.5" />
          {/* Canopy layers */}
          <polygon points="50,15 72,50 28,50" fill="#14532D" />
          <polygon points="50,28 66,58 34,58" fill="#166534" />
          <polygon points="50,42 60,68 40,68" fill="#10B981" />
          <polygon points="50,55 55,75 45,75" fill="#84CC16" />
        </svg>
      );
    }

    // Fallback Nature item
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16">
        <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M50,75 C65,60 65,40 50,25 C35,40 35,60 50,75 Z" fill="#10B981" />
        <line x1="50" y1="75" x2="50" y2="25" stroke="#166534" strokeWidth="2" />
      </svg>
    );
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'Legendary':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/25';
      case 'Epic':
        return 'text-lime-600 bg-lime-500/10 border-lime-500/25 dark:text-lime-400';
      case 'Rare':
        return 'text-sky-600 bg-sky-500/10 border-sky-500/25 dark:text-sky-400';
      default:
        return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400';
    }
  };

  const getTreeTypeEmoji = (points: number) => {
    if (points < 100) return '🌱';
    if (points < 500) return '🌿';
    if (points < 1500) return '🌲';
    return '🌳';
  };

  const renderForestTreeSVG = (points: number) => {
    if (points < 100) {
      return (
        <svg viewBox="0 0 100 100" className="w-9 h-9 transition-transform duration-300 group-hover:scale-110">
          <path d="M50,85 Q47,65 50,55" stroke="#166534" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M50,70 Q42,60 38,63" stroke="#166534" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M38,63 C35,60 40,56 44,60" fill="#10B981" />
        </svg>
      );
    } else if (points < 500) {
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 transition-transform duration-300 group-hover:scale-110">
          <path d="M50,90 Q48,65 50,45" stroke="#8B5E3C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M50,65 Q35,55 28,60" stroke="#8B5E3C" strokeWidth="2.2" fill="none" />
          <path d="M28,60 C24,55 30,48 36,55" fill="#10B981" />
          <path d="M50,55 Q62,45 68,50" stroke="#8B5E3C" strokeWidth="2.2" fill="none" />
          <path d="M68,50 C72,45 66,38 60,45" fill="#84CC16" />
        </svg>
      );
    } else if (points < 1500) {
      return (
        <svg viewBox="0 0 100 100" className="w-11 h-11 transition-transform duration-300 group-hover:scale-110">
          <path d="M50,90 L50,52" stroke="#8B5E3C" strokeWidth="6.5" strokeLinecap="round" />
          <circle cx="50" cy="42" r="18" fill="#166534" opacity="0.9" />
          <circle cx="40" cy="47" r="14" fill="#10B981" opacity="0.85" />
          <circle cx="60" cy="47" r="14" fill="#84CC16" opacity="0.85" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 transition-transform duration-300 group-hover:scale-115">
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
    <div className="max-w-5xl mx-auto space-y-8 fade-in">
      
      {/* 1. Header and Selector Tabs */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-primary"></div>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
            <Trees className="w-5 h-5 text-primary" />
            Eco Garden Canvas
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">Manage your unlocked botanical collectibles and collaborate with college communities.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2.5 p-1 bg-muted/50 rounded-2xl border border-border/80 flex-shrink-0">
          <button
            onClick={() => { setActiveSubTab('garden'); setSelectedTeamId(null); }}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'garden' && !selectedTeamId
                ? 'bg-card text-primary border border-border shadow-sm font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Collection
          </button>
          <button
            onClick={() => { setActiveSubTab('communities'); }}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'communities' || selectedTeamId
                ? 'bg-card text-primary border border-border shadow-sm font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Eco Communities
          </button>
        </div>
      </div>

      {/* 2. SUBTAB CONTENT AREA */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB A: MY ECO COLLECTION */}
        {activeSubTab === 'garden' && !selectedTeamId && (
          <motion.div
            key="collection-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
          >
            {collectibles.map((item) => (
              <div 
                key={item.id}
                className="bg-card border border-border p-5 rounded-3xl flex flex-col items-center justify-between text-center relative overflow-hidden shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300"
              >
                {/* Rarity Tag */}
                <span className={`absolute top-4 right-4 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getRarityStyle(item.rarity)}`}>
                  {item.rarity}
                </span>

                <div className="my-5 hover:scale-105 transition-transform duration-300">
                  {renderCollectibleSVG(item.id, item.rarity)}
                </div>

                <div className="w-full">
                  <h4 className="text-xs font-black text-foreground">{item.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed mt-2.5 max-w-[180px] mx-auto">
                    {item.description}
                  </p>
                  <span className="text-[8px] font-mono text-muted-foreground/50 uppercase block mt-3.5">
                    Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {collectibles.length === 0 && (
              <div className="sm:col-span-2 md:col-span-4 bg-card border border-border p-12 rounded-3xl text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-primary/10 text-primary rounded-full border border-primary/20 mb-4 animate-pulse">
                  <Sprout className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-black text-foreground">Your Garden is Seedless</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mt-2 font-medium">
                  Log your daily carbon footprint consistently to trigger streak milestone collectibles like Sprouts, Oak Saplings, Bonsai Trees, and Rare Redwoods!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* SUBTAB B: COMMUNITIES HUB LIST */}
        {activeSubTab === 'communities' && !selectedTeamId && (
          <motion.div
            key="communities-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* CTA to form group */}
            <div className="flex justify-between items-center bg-card border border-border px-6 py-4.5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Collaborate & Compete</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Form teams, eco clubs, or departments to coordinate emission reductions.</p>
                </div>
              </div>
              <button
                onClick={() => setCreateOpen(true)}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Form Community
              </button>
            </div>

            {/* Communities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {communities.map((team) => (
                <div 
                  key={team.id}
                  className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/25 h-60"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                        {team.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 font-mono">
                        🌱 {team.points} XP
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-foreground">{team.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1 flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-muted-foreground/70" />
                      {team.collegeName}
                    </p>

                    <div className="mt-4.5 flex items-center gap-1.5">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {team.members.slice(0, 3).map((m, idx) => (
                          <div key={idx} className="w-5.5 h-5.5 rounded-full bg-muted border border-card flex items-center justify-center text-[8px] font-black text-muted-foreground uppercase shadow-sm">
                            {m.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-4 flex gap-3.5 justify-between items-center">
                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      className="flex-1 bg-muted hover:bg-border border border-border text-foreground font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Join Group
                    </button>
                    <button
                      onClick={() => setSelectedTeamId(team.id)}
                      className="bg-primary text-primary-foreground font-bold text-xs py-2 px-4.5 rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer flex items-center gap-1"
                    >
                      Forest <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}

              {communities.length === 0 && (
                <div className="md:col-span-3 bg-card border border-border p-12 rounded-3xl text-center flex flex-col items-center justify-center">
                  <Info className="w-8 h-8 text-primary mb-3.5 animate-pulse" />
                  <h3 className="text-sm font-black text-foreground">No Active Communities</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1.5 font-medium leading-relaxed">
                    Form the very first campus eco club or department team to start competing on shared carbon-saving scores!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SUBTAB C: COMMUNITY FOREST CANVAS VIEW */}
        {selectedTeamId && (
          <motion.div
            key="forest-canvas-tab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Forest header & return CTA */}
            <div className="bg-card border border-border p-6 rounded-3xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-accent"></div>
              
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Trees className="w-5 h-5 text-emerald-600" />
                  {forestData?.team.name} Shared Forest
                </h3>
                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                  Type: {forestData?.team.type.replace('_', ' ')} • Cumulative Points: {forestData?.team.points} XP
                </p>
              </div>

              <button
                onClick={() => setSelectedTeamId(null)}
                className="bg-muted hover:bg-border text-foreground border border-border font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm"
              >
                Back to Communities
              </button>
            </div>

            {/* Shared Forest Grid */}
            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/15 rounded-3xl p-8 min-h-[300px] flex flex-wrap justify-center items-end gap-6 relative shadow-inner">
              {loadingForest ? (
                <div className="w-full flex flex-col items-center justify-center py-12 relative overflow-hidden">
                  {/* Scrolling fog layers */}
                  <div className="absolute inset-0 pointer-events-none opacity-30 select-none z-10 mix-blend-overlay">
                    <div className="absolute w-[200%] h-full top-0 left-0 bg-repeat-x fog-scrolling" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='200' viewBox='0 0 1000 200'%3E%3Cpath d='M0,150 Q120,80 250,130 T500,100 T750,150 T1000,120 L1000,200 L0,200 Z' fill='%23ffffff' opacity='0.25'/%3E%3C/svg%3E")` }}></div>
                  </div>
                  {/* Small growing sapling placeholders */}
                  <div className="flex justify-center gap-8 z-0 my-4">
                    {[1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [0.9, 1.05, 0.9], y: [0, -2, 0] }}
                        transition={{ duration: 1.8 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center opacity-60"
                      >
                        <svg viewBox="0 0 100 100" className="w-12 h-12">
                          <ellipse cx="50" cy="85" rx="20" ry="3" fill="#8B5E3C" opacity="0.4" />
                          <path d="M50,85 Q46,70 52,60" stroke="#10B981" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                          <path d="M52,60 Q57,55 60,58 Q56,62 52,60" fill="#84CC16" />
                        </svg>
                        <span className="text-[8px] font-extrabold text-muted-foreground mt-1.5 uppercase tracking-widest">Growing...</span>
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-bold z-20">Cultivating forest canopy...</span>
                </div>
              ) : (
                forestData?.forest.map((member, idx) => {
                  const treeEmoji = getTreeTypeEmoji(member.points);
                  const rankLabel = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                  return (
                    <div 
                      key={member.id}
                      className="group relative cursor-pointer flex flex-col items-center justify-end h-24 w-18"
                    >
                      <div className="transform group-hover:rotate-3 transition-transform duration-300 origin-bottom flex items-end justify-center h-full">
                        {renderForestTreeSVG(member.points)}
                      </div>
                      
                      <span className="text-[9px] font-black text-muted-foreground mt-2 truncate w-full text-center pr-1 pl-1">
                        {member.full_name?.split(' ')[0] || 'Grower'}
                      </span>

                      {/* Tooltip detail card */}
                      <div className="pointer-events-none absolute bottom-full mb-3 z-30 w-44 bg-card border border-border rounded-2xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 text-left">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-600 font-mono">Contributor</span>
                          <span className="text-[10px] font-black text-foreground">{rankLabel}</span>
                        </div>
                        <h4 className="text-xs font-black text-foreground truncate">{member.full_name || 'Anonymous Member'}</h4>
                        <p className="text-[9px] text-muted-foreground font-semibold mt-0.5 truncate flex items-center gap-1">
                          <School className="w-3 h-3 text-muted-foreground/75" />
                          {member.college_name || 'Individual'}
                        </p>
                        
                        <div className="mt-2 pt-1.5 border-t border-border flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-emerald-600">🌱 +{member.points} XP</span>
                          <span className="text-muted-foreground font-semibold">{(member.points * 0.15).toFixed(0)}kg CO₂</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {!loadingForest && forestData?.forest.length === 0 && (
                <div className="text-center text-muted-foreground text-xs font-semibold py-12 flex flex-col items-center">
                  <Trees className="w-8 h-8 text-primary mb-2 animate-bounce" />
                  Your group forest is empty. Have members log entries to start planting!
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* CREATE COMMUNITY DRAWER DIALOG MODAL */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border w-full max-w-md p-6 rounded-3xl shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-black text-foreground">Form Community Group</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Initialize a new team or club to track collective reductions.</p>
                </div>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer border border-transparent"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateTeam} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase tracking-wider">Group Name</label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Campus Climate Alliance"
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase tracking-wider">Community Category</label>
                  <select
                    value={newTeamType}
                    onChange={(e: any) => setNewTeamType(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="team">Team / Department</option>
                    <option value="college_group">College / University Group</option>
                    <option value="eco_club">Environmental Eco Club</option>
                    <option value="department">Campus Department</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="bg-muted hover:bg-border text-foreground font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-primary/10 cursor-pointer flex items-center justify-center"
                  >
                    {submitting ? 'Creating...' : 'Form Community'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple local RefreshCw fallback component
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path d="M3 3v5h5M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
