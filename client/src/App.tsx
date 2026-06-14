import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Leaf, 
  LayoutDashboard, 
  Calculator as CalcIcon, 
  Sparkles, 
  Trophy, 
  User as UserIcon, 
  LogOut, 
  ShieldAlert, 
  Sun, 
  Moon,
  ListTodo
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Calculator from './components/Calculator';
import Assistant from './components/Assistant';
import Challenges from './components/Challenges';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auth States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [city, setCity] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 1. Manage Active Session & Fetch Profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // 2. Light/Dark Mode Toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Toast Trigger
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 3. Register / Login Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (!authEmail || !authPassword) {
      setAuthError('Email and Password are required');
      setAuthLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!fullName || !collegeName || !city) {
          setAuthError('All profile fields are required for registration');
          setAuthLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: fullName,
              college_name: collegeName,
              city: city,
              role: 'user'
            }
          }
        });

        if (error) throw error;
        
        triggerToast('Registration successful! Logging in...', 'success');
        // If registration auto-logs in, session will update automatically
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });

        if (error) throw error;
        triggerToast('Welcome back to EcoTrack AI!', 'success');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during authentication');
      triggerToast(err.message || 'Authentication failed', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    triggerToast('Logged out successfully', 'info');
  };

  // Render Authentication Modal UI if no active session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#09090b] px-4 py-12 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-emerald-500/10 rounded-xl mb-3 text-primary">
              <Leaf className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              EcoTrack AI
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
              Carbon Footprint Awareness & Analytics Platform
            </p>
          </div>

          {authError && (
            <div className="mb-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 rounded-lg p-3 text-sm flex gap-2.5 items-center">
              <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-zinc-950 dark:text-zinc-50"
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                      College / University
                    </label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-zinc-950 dark:text-zinc-50"
                      placeholder="Stanford"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-zinc-950 dark:text-zinc-50"
                      placeholder="San Francisco"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-zinc-950 dark:text-zinc-50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-zinc-950 dark:text-zinc-50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg py-2.5 font-semibold transition-colors duration-200 shadow-md flex justify-center items-center cursor-pointer"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isRegistering ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-zinc-100 dark:border-zinc-900 pt-4">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError('');
              }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline bg-transparent border-none cursor-pointer"
            >
              {isRegistering
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render dashboard layout for authenticated session
  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#09090b] text-foreground transition-colors duration-200">
      
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] flex flex-col justify-between p-5 flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-3 mb-6">
            <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="font-extrabold text-lg tracking-tight">EcoTrack AI</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <CalcIcon className="w-4.5 h-4.5" />
              Footprint Calculator
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Sparkles className="w-4.5 h-4.5" />
              AI Recommendations
            </button>

            <button
              onClick={() => setActiveTab('challenges')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'challenges'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <ListTodo className="w-4.5 h-4.5" />
              Eco Challenges
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Trophy className="w-4.5 h-4.5" />
              Leaderboards
            </button>

            {userProfile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <UserIcon className="w-4.5 h-4.5 text-blue-500" />
                Admin Panel
              </button>
            )}
          </nav>
        </div>

        {/* User profile details and Logout button */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                {userProfile?.full_name || 'EcoTrack User'}
              </h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                {userProfile?.points || 0} XP Points
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Content Window */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Row */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] flex justify-between items-center px-8 flex-shrink-0">
          <h2 className="text-lg font-bold tracking-tight capitalize">
            {activeTab === 'assistant' ? 'AI Recommendations' : activeTab.replace('-', ' ')}
          </h2>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Points Indicator Pill */}
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
              <span>🌱</span>
              <span>{userProfile?.points || 0} XP</span>
            </div>
          </div>
        </header>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-8 max-w-[1600px] w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
          {activeTab === 'calculator' && <Calculator triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
          {activeTab === 'assistant' && <Assistant />}
          {activeTab === 'challenges' && <Challenges triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'admin' && userProfile?.role === 'admin' && <AdminPanel />}
        </main>
      </div>

      {/* Floating Action Feedback Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 animate-bounce max-w-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400' 
            : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-400'
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
