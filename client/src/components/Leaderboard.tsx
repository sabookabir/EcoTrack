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
  Award
} from 'lucide-react';

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

export default function Leaderboard() {
  const [activeSubTab, setActiveSubTab] = useState<'global' | 'colleges'>('global');

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
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl"></div>
        <div className="h-96 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl text-center shadow-sm max-w-xl mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold mb-1">Failed to Load Leaderboards</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          {error instanceof Error ? error.message : 'Network error occurred.'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const globalRankings = data?.global || [];
  const collegeRankings = data?.colleges || [];
  const userRank = data?.userRanking;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* 1. User Position Summary Cards */}
      {userRank && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>

          {/* Global Position */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Global Standing</span>
              <h3 className="text-xl font-black text-zinc-950 dark:text-white mt-0.5">
                #{userRank.globalRank} <span className="text-xs text-zinc-400 font-semibold">of {userRank.totalUsersGlobal}</span>
              </h3>
            </div>
          </div>

          {/* Campus Position */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-900 pt-4 md:pt-0 md:pl-6">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-500/10">
              <School className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Campus Standing</span>
              <h3 className="text-xl font-black text-zinc-950 dark:text-white mt-0.5">
                {userRank.collegeRank ? `#${userRank.collegeRank}` : 'N/A'}{' '}
                <span className="text-xs text-zinc-400 font-semibold">of {userRank.totalUsersCollege}</span>
              </h3>
            </div>
          </div>

          {/* User Score XP */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-900 pt-4 md:pt-0 md:pl-6">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-500/10">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Eco Score Accumulation</span>
              <h3 className="text-xl font-black text-zinc-950 dark:text-white mt-0.5">
                {userRank.points} <span className="text-xs text-zinc-400 font-semibold">XP</span>
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* 2. Subtab selector and Rankings Table */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Subtab Bar */}
        <div className="border-b border-zinc-100 dark:border-zinc-900 px-6 py-4 flex gap-4 bg-zinc-50/50 dark:bg-zinc-900/10">
          <button
            onClick={() => setActiveSubTab('global')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeSubTab === 'global'
                ? 'bg-zinc-900 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-800 text-white'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 shadow-sm'
            }`}
          >
            Global Eco Users
          </button>
          <button
            onClick={() => setActiveSubTab('colleges')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeSubTab === 'colleges'
                ? 'bg-zinc-900 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-800 text-white'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 shadow-sm'
            }`}
          >
            College Rankings
          </button>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto">
          {activeSubTab === 'global' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-6 w-16 text-center">Rank</th>
                  <th className="py-3 px-6">Name / Member</th>
                  <th className="py-3 px-6"><span className="flex items-center gap-1"><School className="w-3.5 h-3.5" /> Campus</span></th>
                  <th className="py-3 px-6"><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> City</span></th>
                  <th className="py-3 px-6 text-right w-28">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm text-zinc-600 dark:text-zinc-300">
                {globalRankings.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-6 text-center font-bold text-zinc-950 dark:text-white">
                      {idx === 0 && '🥇'}
                      {idx === 1 && '🥈'}
                      {idx === 2 && '🥉'}
                      {idx > 2 && `#${idx + 1}`}
                    </td>
                    <td className="py-4 px-6 font-semibold text-zinc-950 dark:text-white">
                      {user.full_name || 'Anonymous User'}
                    </td>
                    <td className="py-4 px-6">{user.college_name || 'N/A'}</td>
                    <td className="py-4 px-6">{user.city || 'N/A'}</td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {user.points} XP
                    </td>
                  </tr>
                ))}
                {globalRankings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400 text-xs">
                      No leaderboard logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-6 w-16 text-center">Rank</th>
                  <th className="py-3 px-6">College / University</th>
                  <th className="py-3 px-6 w-32 text-center">Active Users</th>
                  <th className="py-3 px-6 text-right w-32">Average Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm text-zinc-600 dark:text-zinc-300">
                {collegeRankings.map((college, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-6 text-center font-bold text-zinc-950 dark:text-white">
                      {idx === 0 && '🥇'}
                      {idx === 1 && '🥈'}
                      {idx === 2 && '🥉'}
                      {idx > 2 && `#${idx + 1}`}
                    </td>
                    <td className="py-4 px-6 font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
                      <School className="w-4 h-4 text-zinc-400" />
                      {college.college_name}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-zinc-500 dark:text-zinc-400">
                      {college.user_count}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-blue-600 dark:text-blue-400">
                      {college.avg_points} XP
                    </td>
                  </tr>
                ))}
                {collegeRankings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400 text-xs">
                      No college records found.
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
