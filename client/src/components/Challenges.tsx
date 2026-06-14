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
  AlertCircle
} from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl text-center shadow-sm max-w-xl mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold mb-1">Failed to Load Eco Challenges</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          {error instanceof Error ? error.message : 'Server communication lapsed.'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-colors cursor-pointer"
        >
          <RotateCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const challenges = data?.challenges || [];
  const achievements = data?.achievements || [];

  return (
    <div className="space-y-12">
      
      {/* 1. Eco Challenges Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">Active Eco Challenges</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Commit to actionable tasks and earn points for your profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((chal) => (
            <div 
              key={chal.id} 
              className={`bg-white dark:bg-[#0c0c0f] border rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all ${
                chal.status === 'completed' 
                  ? 'border-emerald-500/20 bg-emerald-500/[0.01]' 
                  : chal.status === 'active'
                    ? 'border-blue-500/20 bg-blue-500/[0.01]'
                    : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {/* Badge Status Pill */}
              <div className="absolute top-4 right-4">
                {chal.status === 'completed' && (
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
                {chal.status === 'active' && (
                  <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">{chal.category}</span>
                <h3 className="text-base font-extrabold text-zinc-950 dark:text-white mb-2 leading-tight">{chal.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">{chal.description}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-900 mt-2">
                <div className="flex gap-4 text-xs font-semibold text-zinc-400">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> {chal.duration_days} days</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">🌱 +{chal.points} XP</span>
                </div>

                <div>
                  {chal.status === 'not_started' && (
                    <button
                      onClick={() => handleJoin(chal.id)}
                      disabled={submittingId !== null}
                      className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" /> Join
                    </button>
                  )}
                  {chal.status === 'active' && (
                    <button
                      onClick={() => handleComplete(chal.id)}
                      disabled={submittingId !== null}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Achievements Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">Profile Badges & Achievements</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Unlocked badges represent milestones in your sustainability journey.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <div 
              key={ach.id} 
              className={`border rounded-xl p-5 shadow-sm flex items-start gap-4 transition-all ${
                ach.unlocked 
                  ? 'border-emerald-500/20 bg-white dark:bg-[#0c0c0f]' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 opacity-70'
              }`}
            >
              {/* Badge Icon */}
              <div className={`p-3.5 rounded-xl border flex-shrink-0 ${
                ach.unlocked 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
              }`}>
                {ach.unlocked ? <Award className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white mb-1 leading-none">{ach.name}</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal mt-1.5 mb-3">{ach.description}</p>
                <div className="text-[10px] font-bold font-mono">
                  {ach.unlocked ? (
                    <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Unlocked</span>
                  ) : (
                    <span className="text-zinc-400 uppercase tracking-wider">Requires {ach.points_required} XP</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
