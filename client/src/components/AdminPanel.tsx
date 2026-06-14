import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  Users, 
  Leaf, 
  Activity, 
  PlusCircle, 
  Trash2, 
  RefreshCw,
  History,
  ListTodo
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCO2Tracked: number;
  activeUsers: number;
  challenges: {
    totalJoined: number;
    totalCompleted: number;
    completionRate: number;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  college_name: string | null;
  points: number;
  role: 'user' | 'admin';
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: any;
  ip_address: string | null;
  created_at: string;
  users: {
    email: string;
    full_name: string;
  } | null;
}

interface Challenge {
  id: string;
  title: string;
  category: string;
  points: number;
}

export default function AdminPanel() {
  const [adminSubTab, setAdminSubTab] = useState<'stats' | 'challenges' | 'users' | 'logs'>('stats');

  // Challenge Form State
  const [chalTitle, setChalTitle] = useState('');
  const [chalDesc, setChalDesc] = useState('');
  const [chalPoints, setChalPoints] = useState<number | ''>('');
  const [chalDays, setChalDays] = useState<number | ''>('');
  const [chalCat, setChalCat] = useState('transportation');
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/admin/stats`, { headers });
      return res.data.data as AdminStats;
    },
    enabled: adminSubTab === 'stats'
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/admin/users`, { headers });
      return res.data.data as UserProfile[];
    },
    enabled: adminSubTab === 'users'
  });

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['adminLogs'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/admin/audit-logs`, { headers });
      return res.data.data as AuditLog[];
    },
    enabled: adminSubTab === 'logs'
  });

  const { data: challenges, isLoading: chLoading, refetch: refetchCh } = useQuery({
    queryKey: ['adminChallenges'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BACKEND_URL}/challenges`, { headers });
      return res.data.data.challenges as Challenge[];
    },
    enabled: adminSubTab === 'challenges'
  });

  // Handle Challenge Create
  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFeedback(null);

    if (!chalTitle || !chalDesc || !chalPoints || !chalDays) {
      setFeedback({ message: 'All challenge fields are required.', type: 'error' });
      setFormLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      await axios.post(`${BACKEND_URL}/admin/challenges`, {
        title: chalTitle,
        description: chalDesc,
        points: Number(chalPoints),
        duration_days: Number(chalDays),
        category: chalCat
      }, { headers });

      setFeedback({ message: `Eco Challenge '${chalTitle}' created successfully!`, type: 'success' });
      setChalTitle('');
      setChalDesc('');
      setChalPoints('');
      setChalDays('');
      refetchCh();
    } catch (err: any) {
      console.error(err);
      setFeedback({ message: err.response?.data?.message || 'Failed to create challenge.', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Challenge Delete
  const handleDeleteChallenge = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) return;
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${BACKEND_URL}/admin/challenges/${id}`, { headers });
      setFeedback({ message: 'Challenge deleted successfully.', type: 'success' });
      refetchCh();
    } catch (err: any) {
      console.error(err);
      setFeedback({ message: err.response?.data?.message || 'Failed to delete challenge.', type: 'error' });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Admin Sub Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] rounded-xl p-1 shadow-sm max-w-xl">
        {(['stats', 'challenges', 'users', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAdminSubTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
              adminSubTab === tab
                ? 'bg-zinc-900 dark:bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-transparent'
            }`}
          >
            {tab === 'logs' ? 'Audit Logs' : tab}
          </button>
        ))}
      </div>

      {/* SUB TAB 1: Platform Stats */}
      {adminSubTab === 'stats' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="h-40 bg-white dark:bg-[#0c0c0f] rounded-xl animate-pulse"></div>
          ) : stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Total Members</span>
                  <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-white mt-1 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" /> {stats.totalUsers}
                  </h2>
                </div>
                <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Total CO2 Tracked</span>
                  <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-white mt-1 flex items-center gap-2">
                    <Leaf className="w-6 h-6 text-emerald-500" /> {stats.totalCO2Tracked} <span className="text-xs font-semibold text-zinc-400">kg</span>
                  </h2>
                </div>
                <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Active Users (7d)</span>
                  <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-white mt-1 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-amber-500 animate-pulse" /> {stats.activeUsers}
                  </h2>
                </div>
                <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Challenge Joins</span>
                  <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-white mt-1 flex items-center gap-2">
                    <ListTodo className="w-6 h-6 text-purple-500" /> {stats.challenges.totalJoined}
                  </h2>
                </div>
              </div>

              {/* Challenge Rate Card */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm max-w-md">
                <h3 className="font-bold text-zinc-950 dark:text-white mb-4">Challenge Completion Performance</h3>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Completion Rate</span>
                  <span className="text-emerald-500">{stats.challenges.completionRate}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 mb-4">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.challenges.completionRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-500">
                  <div>Joined: <span className="text-zinc-900 dark:text-white">{stats.challenges.totalJoined}</span></div>
                  <div>Completed: <span className="text-zinc-900 dark:text-white">{stats.challenges.totalCompleted}</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB TAB 2: Manage Challenges */}
      {adminSubTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Creator Form */}
          <div className="lg:col-span-1 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-950 dark:text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-4.5 h-4.5 text-emerald-500" /> Create Eco Challenge
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Deploy a new challenge to users.</p>

            {feedback && (
              <div className={`mb-4 px-3 py-2 rounded-lg text-xs border ${
                feedback.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400' 
                  : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400'
              }`}>
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  value={chalTitle}
                  onChange={(e) => setChalTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-950 dark:text-zinc-50"
                  placeholder="e.g. Save Water 5 Days"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={chalDesc}
                  onChange={(e) => setChalDesc(e.target.value)}
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-950 dark:text-zinc-50"
                  placeholder="Describe the challenge goals..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">XP Points</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={chalPoints}
                    onChange={(e) => setChalPoints(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-950 dark:text-zinc-50"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Duration (days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={chalDays}
                    onChange={(e) => setChalDays(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-950 dark:text-zinc-50"
                    placeholder="7"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={chalCat}
                  onChange={(e) => setChalCat(e.target.value)}
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-950 dark:text-zinc-50 cursor-pointer"
                >
                  <option value="transportation">Transportation</option>
                  <option value="energy">Energy</option>
                  <option value="food">Diet / Food</option>
                  <option value="waste">Waste</option>
                  <option value="community">Community</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg py-2 font-semibold transition-colors duration-200 shadow-md flex justify-center items-center cursor-pointer"
              >
                {formLoading ? 'Creating...' : 'Deploy Challenge'}
              </button>
            </form>
          </div>

          {/* List of Challenges */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-950 dark:text-white mb-4">Active Challenges</h3>
            {chLoading ? (
              <div className="h-32 bg-zinc-50 dark:bg-zinc-900 rounded-xl animate-pulse"></div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {(challenges || []).map((c) => (
                  <div key={c.id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">{c.title}</h4>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{c.category} • +{c.points} XP</p>
                    </div>
                    <button
                      onClick={() => handleDeleteChallenge(c.id)}
                      className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
                {(!challenges || challenges.length === 0) && (
                  <p className="text-zinc-400 text-xs text-center py-6">No challenges active.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 3: Users List */}
      {adminSubTab === 'users' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex justify-between items-center">
            <h3 className="font-bold text-zinc-950 dark:text-white">Registered Users</h3>
            <button
              onClick={() => refetchUsers()}
              className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 p-1.5 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {usersLoading ? (
              <div className="h-40 bg-white dark:bg-[#0c0c0f] rounded-xl animate-pulse"></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">College</th>
                    <th className="py-3 px-6 w-24 text-center">Role</th>
                    <th className="py-3 px-6 text-right w-28">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm text-zinc-600 dark:text-zinc-300">
                  {users?.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-zinc-950 dark:text-white">{u.full_name || 'N/A'}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-zinc-500">{u.email}</td>
                      <td className="py-3.5 px-6">{u.college_name || 'N/A'}</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-black text-emerald-600 dark:text-emerald-400">{u.points} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 4: Audit Logs */}
      {adminSubTab === 'logs' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex justify-between items-center">
            <h3 className="font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-zinc-400" /> Platform Security & Audit Logs
            </h3>
            <button
              onClick={() => refetchLogs()}
              className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 p-1.5 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {logsLoading ? (
              <div className="h-40 bg-white dark:bg-[#0c0c0f] rounded-xl animate-pulse"></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-6 w-44">Date</th>
                    <th className="py-3 px-6">Member</th>
                    <th className="py-3 px-6 w-48">Action</th>
                    <th className="py-3 px-6">Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs text-zinc-500 font-mono">
                  {logs?.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-6 text-zinc-400">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="py-3 px-6 font-semibold text-zinc-900 dark:text-zinc-200">
                        {l.users ? l.users.full_name || l.users.email : 'System/Anon'}
                      </td>
                      <td className="py-3 px-6">
                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-[10px] text-zinc-400 truncate max-w-xs" title={JSON.stringify(l.details)}>
                        {JSON.stringify(l.details)}
                      </td>
                    </tr>
                  ))}
                  {logs?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-400 text-xs">
                        No audit logs captured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
