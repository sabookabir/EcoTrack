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
  ListTodo,
  Globe,
  Trees,
  Activity,
  ArrowRight,
  Lock,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import Calculator from './components/Calculator';
import Assistant from './components/Assistant';
import Challenges from './components/Challenges';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import Garden from './components/Garden';
import AuthLoader from './components/AuthLoader';


const getEcoLevel = (points: number = 0) => {
  if (points < 100) {
    return {
      name: 'Seedling',
      emoji: '🌱',
      min: 0,
      max: 100,
      nextLevel: 'Eco Explorer',
      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
      barColor: 'bg-emerald-600 dark:bg-emerald-400'
    };
  }
  if (points < 300) {
    return {
      name: 'Eco Explorer',
      emoji: '🌿',
      min: 100,
      max: 300,
      nextLevel: 'Green Warrior',
      color: 'text-teal-700 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20',
      barColor: 'bg-teal-600 dark:bg-teal-400'
    };
  }
  if (points < 600) {
    return {
      name: 'Green Warrior',
      emoji: '🌳',
      min: 300,
      max: 600,
      nextLevel: 'Nature Guardian',
      color: 'text-lime-700 dark:text-lime-400 bg-lime-500/10 dark:bg-lime-500/20 border-lime-500/20',
      barColor: 'bg-lime-600 dark:bg-lime-400'
    };
  }
  if (points < 1000) {
    return {
      name: 'Nature Guardian',
      emoji: '🏞',
      min: 600,
      max: 1000,
      nextLevel: 'Climate Champion',
      color: 'text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border-green-500/20',
      barColor: 'bg-green-600 dark:bg-green-400'
    };
  }
  if (points < 1500) {
    return {
      name: 'Climate Champion',
      emoji: '🌎',
      min: 1000,
      max: 1500,
      nextLevel: 'Earth Protector',
      color: 'text-blue-700 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
      barColor: 'bg-blue-600 dark:bg-blue-400'
    };
  }
  if (points < 2200) {
    return {
      name: 'Earth Protector',
      emoji: '🌍',
      min: 1500,
      max: 2200,
      nextLevel: 'Sustainability Legend',
      color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20',
      barColor: 'bg-indigo-600 dark:bg-indigo-400'
    };
  }
  if (points < 3000) {
    return {
      name: 'Sustainability Legend',
      emoji: '⭐',
      min: 2200,
      max: 3000,
      nextLevel: 'Eco Master',
      color: 'text-purple-700 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20',
      barColor: 'bg-purple-600 dark:bg-purple-400'
    };
  }
  if (points < 4000) {
    return {
      name: 'Eco Master',
      emoji: '🏆',
      min: 3000,
      max: 4000,
      nextLevel: 'Planet Guardian Elite',
      color: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
      barColor: 'bg-amber-600 dark:bg-amber-400'
    };
  }
  return {
    name: 'Planet Guardian Elite',
    emoji: '💎',
    min: 4000,
    max: 100000,
    nextLevel: 'Max Rank Unlocked!',
    color: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',
    barColor: 'bg-rose-600 dark:bg-rose-400'
  };
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // default to natural light theme
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Landing Page Drawer control
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);

  // Auth States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [city, setCity] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Advanced Loader States
  const [authTransition, setAuthTransition] = useState<{ active: boolean; isLong: boolean } | null>({ active: true, isLong: false });
  const [initializing, setInitializing] = useState(true);

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

  // 1. Manage Active Session & Fetch Profile with Loading Experience
  useEffect(() => {
    let sessionResolved = false;
    let timerResolved = false;

    const checkSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          await fetchUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Initial session fetch error:', err);
      } finally {
        sessionResolved = true;
        maybeComplete();
      }
    };

    const timer = setTimeout(() => {
      timerResolved = true;
      maybeComplete();
    }, 1500); // 1.5s short loader for initial restoration

    const maybeComplete = () => {
      if (sessionResolved && timerResolved) {
        setAuthTransition(null);
        setInitializing(false);
      }
    };

    checkSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!initializing) {
        setSession(currentSession);
        if (currentSession) {
          await fetchUserProfile(currentSession.user.id);
          setShowAuthDrawer(false);
        } else {
          setUserProfile(null);
        }
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [initializing]);

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
    setAuthError('');

    if (!authEmail || !authPassword) {
      setAuthError('Email and Password are required');
      return;
    }

    if (isRegistering && (!fullName || !collegeName || !city)) {
      setAuthError('All profile fields are required for registration');
      return;
    }

    setAuthLoading(true);
    setAuthTransition({ active: true, isLong: true });
    const startTime = Date.now();

    try {
      if (isRegistering) {
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
        triggerToast('Account created successfully!', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });

        if (error) throw error;
        triggerToast('Welcome back to EcoTrack AI!', 'success');
      }

      // Hold loader for remainder of 4.5 seconds if successful
      const elapsed = Date.now() - startTime;
      const remaining = 4500 - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setAuthTransition(null);
    } catch (err: any) {
      setAuthTransition(null); // dismiss immediately on error
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

  const currentPoints = userProfile?.points || 0;
  const ecoLevel = getEcoLevel(currentPoints);
  const nextLevelProgress = Math.min(
    ((currentPoints - ecoLevel.min) / (ecoLevel.max - ecoLevel.min)) * 100,
    100
  );

  // Render unauthenticated Homepage Landing Screen
  if (!session) {
    return (
      <>
        {authTransition && <AuthLoader isLong={authTransition.isLong} />}
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden flex flex-col justify-between">
        
        {/* Soft Background Blur Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-3xl pointer-events-none pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Floating leaves icons */}
        <div className="leaf-particle leaf-particle-1 top-24 left-[15%] text-emerald-500/20"><Leaf className="w-8 h-8 rotate-12" /></div>
        <div className="leaf-particle leaf-particle-2 top-[60%] left-[8%] text-primary/15"><Leaf className="w-6 h-6 -rotate-[45deg]" /></div>
        <div className="leaf-particle leaf-particle-3 top-48 right-[20%] text-accent/25"><Leaf className="w-10 h-10 rotate-[80deg]" /></div>

        {/* Landing Header */}
        <header className="max-w-7xl w-full mx-auto px-6 h-20 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight">EcoTrack AI</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer border border-border shadow-sm"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => {
                setIsRegistering(false);
                setAuthError('');
                setShowAuthDrawer(true);
              }}
              className="px-4.5 py-2.5 bg-card hover:bg-muted border border-border rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer text-foreground"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-grow z-10 py-12">
          
          {/* Left Hero detail */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-extrabold uppercase tracking-widest">
              <span>🌱</span> Track. Reduce. Regrow.
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
              Understand Your Impact.<br />
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Build a Greener Future.</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Track daily emissions, consult our EcoGuide AI coach, join green missions, and grow digital forests with a platform built to save the planet.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setAuthError('');
                  setShowAuthDrawer(true);
                }}
                className="w-full sm:w-auto px-7 py-4 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                Start Tracking <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsRegistering(false);
                  setAuthError('');
                  setShowAuthDrawer(true);
                }}
                className="w-full sm:w-auto px-7 py-4 bg-card hover:bg-muted border border-border text-foreground font-bold rounded-2xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer text-xs"
              >
                View Community Forest
              </button>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 max-w-md mx-auto lg:mx-0 border-t border-border">
              <div>
                <h4 className="text-xl font-black text-foreground">14.8k</h4>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">CO₂ Saved (kg)</p>
              </div>
              <div>
                <h4 className="text-xl font-black text-foreground">670+</h4>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Trees Grown</p>
              </div>
              <div>
                <h4 className="text-xl font-black text-foreground">Stanford</h4>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Top Campus</p>
              </div>
            </div>
          </div>

          {/* Right Hero: Rotating Earth visual */}
          <div className="flex justify-center items-center relative lg:h-[450px]">
            {/* Glowing atmosphere */}
            <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl pointer-events-none"></div>
            
            {/* CSS Rotating Globe Sphere */}
            <div className="earth-sphere transition-all duration-500 hover:scale-[1.03]">
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white/20 rounded-full blur-sm"></div>
            </div>

            {/* Organic Floating labels around the earth */}
            <div className="absolute -top-4 right-1/4 bg-card border border-border p-3.5 rounded-2xl shadow-md text-xs font-extrabold text-foreground flex items-center gap-2 animate-bounce">
              <span className="text-lg">🌲</span> Stanford planted 40 trees
            </div>
            <div className="absolute bottom-4 left-12 bg-card border border-border p-3.5 rounded-2xl shadow-md text-xs font-extrabold text-foreground flex items-center gap-2">
              <span className="text-lg">⚡</span> Home solar active
            </div>
          </div>

        </main>

        <footer className="h-16 border-t border-border bg-card flex items-center justify-center text-xs text-muted-foreground z-10 font-medium">
          © {new Date().getFullYear()} EcoTrack AI. Track. Reduce. Regrow. All rights reserved.
        </footer>

        {/* Sliding Auth Drawer Modal */}
        <AnimatePresence>
          {showAuthDrawer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAuthDrawer(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowAuthDrawer(false)}
                  className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all cursor-pointer border border-transparent"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-3.5 text-primary">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">
                    {isRegistering ? 'Start Regrowing' : 'Welcome to EcoTrack'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-1 font-semibold">
                    {isRegistering ? 'Create a profile to sync carbon metrics' : 'Sign in to review your eco ecosystem health'}
                  </p>
                </div>

                {authError && (
                  <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-2xl p-3.5 text-xs flex gap-2.5 items-center">
                    <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
                    <span className="font-semibold">{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                  {isRegistering && (
                    <>
                      <div>
                        <label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1 pl-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder-muted-foreground/30 transition-all"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1 pl-1">Campus</label>
                          <input
                            type="text"
                            required
                            value={collegeName}
                            onChange={(e) => setCollegeName(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder-muted-foreground/30 transition-all"
                            placeholder="Stanford"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1 pl-1">City</label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder-muted-foreground/30 transition-all"
                            placeholder="San Francisco"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1 pl-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder-muted-foreground/30 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1 pl-1">Password</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder-muted-foreground/30 transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-50 rounded-xl py-3 font-bold transition-all shadow-md flex justify-center items-center cursor-pointer text-xs"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : isRegistering ? (
                      'Create Account'
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center border-t border-border pt-4">
                  <button
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setAuthError('');
                    }}
                    className="text-xs text-secondary hover:underline bg-transparent border-none cursor-pointer font-bold"
                  >
                    {isRegistering
                      ? 'Already have an account? Sign In'
                      : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </>
    );
  }

  // Render dashboard layout for authenticated session
  return (
    <>
      {authTransition && <AuthLoader isLong={authTransition.isLong} />}
      <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300 pb-16 md:pb-0">
      
      {/* 1. Sidebar Navigation (Desktop only) */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col justify-between p-6 flex-shrink-0 relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2.5 py-4 mb-8">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-foreground">EcoTrack AI</span>
          </div>
 
          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <CalcIcon className="w-4 h-4" />
              Onboarding Wizard
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              EcoGuide AI
            </button>

            <button
              onClick={() => setActiveTab('challenges')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'challenges'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Green Missions
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Community Forest
            </button>

            <button
              onClick={() => setActiveTab('garden')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'garden'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Trees className="w-4 h-4 text-emerald-500" />
              Eco Garden
            </button>

            {userProfile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <UserIcon className="w-4 h-4 text-sky-400" />
                Admin Panel
              </button>
            )}
          </nav>
        </div>

        {/* Gamified Sidebar Profile Progress */}
        <div className="border-t border-border pt-5 space-y-4">
          <div className="bg-muted p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{ecoLevel.emoji}</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Level Tier</span>
                <h4 className="text-xs font-extrabold text-foreground leading-tight">{ecoLevel.name}</h4>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[9px] font-bold text-muted-foreground mb-1">
                <span>{currentPoints} XP</span>
                <span>Next: {ecoLevel.nextLevel}</span>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-border/60">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${ecoLevel.barColor}`}
                  style={{ width: `${nextLevelProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {userProfile?.full_name || 'EcoTrack User'}
                </h4>
                <p className="text-[9px] font-bold text-muted-foreground truncate uppercase">
                  {userProfile?.city || 'Earth Citizen'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Sticky Bottom Navigation for Mobile viewports */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border justify-around items-center z-40 px-2 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'calculator' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <CalcIcon className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Wizard</span>
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'assistant' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">EcoGuide AI</span>
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'challenges' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <ListTodo className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Missions</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Trophy className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Forest</span>
        </button>
        <button
          onClick={() => setActiveTab('garden')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'garden' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Trees className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Garden</span>
        </button>
      </nav>

      {/* 2. Main Content Window */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Premium Header Row */}
        <header className="h-16 border-b border-border bg-card flex justify-between items-center px-6 md:px-8 flex-shrink-0">
          <h2 className="text-xs font-extrabold tracking-tight capitalize text-foreground flex items-center gap-2">
            {activeTab === 'assistant' ? 'EcoGuide AI Coach' : activeTab === 'leaderboard' ? 'Community Forest' : activeTab === 'calculator' ? 'Onboarding Wizard' : activeTab === 'challenges' ? 'Green Missions' : activeTab.replace('-', ' ')}
          </h2>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-muted hover:bg-border text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer border border-border shadow-sm"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Points Indicator Pill */}
            <div className="bg-primary/10 text-primary text-xs font-bold px-3.5 py-2 rounded-xl border border-primary/20 flex items-center gap-1.5 shadow-sm">
              <span>🌱</span>
              <span>{userProfile?.points || 0} XP</span>
            </div>

            {/* Profile Avatar Trigger (Mobile logout option) */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1400px] w-full mx-auto relative overflow-hidden">
          {/* Subtle background leaf overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/[0.015] dark:text-emerald-500/[0.007] pointer-events-none select-none z-0">
            <Leaf className="w-[400px] h-[400px] rotate-[30deg] stroke-[0.5]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full"
            >
              {activeTab === 'dashboard' && <Dashboard triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
              {activeTab === 'calculator' && <Calculator triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
              {activeTab === 'assistant' && <Assistant triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
              {activeTab === 'challenges' && <Challenges triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
              {activeTab === 'leaderboard' && <Leaderboard />}
              {activeTab === 'garden' && <Garden triggerToast={triggerToast} refreshProfile={() => fetchUserProfile(session.user.id)} />}
              {activeTab === 'admin' && userProfile?.role === 'admin' && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Action Feedback Toast */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-5 right-5 z-50 px-4 py-3 rounded-2xl border shadow-xl flex items-center gap-3 animate-bounce max-w-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400' 
            : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-400'
        }`}>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
    </>
  );
}
