import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';

interface AuthLoaderProps {
  isLong: boolean;
}

export default function AuthLoader({ isLong }: AuthLoaderProps) {
  const duration = isLong ? 4500 : 1500;
  const stageDuration = duration / 5;
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentStage = Math.min(Math.floor(elapsed / stageDuration), 4);
      setStage(currentStage);
    }, 100);

    return () => clearInterval(interval);
  }, [stageDuration]);

  const STAGES = [
    { text: "Starting your sustainability journey...", icon: "🌱" },
    { text: "Preparing your ecosystem...", icon: "🌿" },
    { text: "Analyzing environmental impact...", icon: "🌳" },
    { text: "Building your personalized dashboard...", icon: "🌲" },
    { text: "Welcome back, Eco Explorer", icon: "🌎" }
  ];

  const currentStageInfo = STAGES[stage] || STAGES[4];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50/30 via-background to-emerald-100/20 dark:from-emerald-950/10 dark:via-background dark:to-emerald-900/5">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">
        
        {/* Animated growing tree SVG */}
        <div className="relative w-48 h-48 flex items-center justify-center bg-card rounded-full border border-border shadow-xl p-4 overflow-hidden">
          {/* Pulsing light behind the tree */}
          <div className="absolute inset-4 rounded-full bg-primary/5 dark:bg-primary/10 blur-xl pulse-glow pointer-events-none"></div>
          
          <svg viewBox="0 0 100 100" className="w-40 h-40 z-10 select-none">
            {/* Ground / Soil (Visible in all stages) */}
            <ellipse cx="50" cy="85" rx="30" ry="5" fill="#8B5E3C" className="opacity-40" />
            
            {/* STAGE 1: Seed 🌱 */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 0 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Soil mound */}
              <path d="M 40 85 Q 50 80 60 85" stroke="#8B5E3C" strokeWidth="2" fill="none" />
              {/* Seed */}
              <circle cx="50" cy="82" r="3" fill="#84CC16" />
              {/* Subtle seedling glow */}
              <circle cx="50" cy="82" r="6" fill="#84CC16" className="opacity-25 animate-ping" />
            </motion.g>

            {/* STAGE 2: Sprout 🌿 */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 1 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Growing curved stem */}
              <path d="M 50 85 Q 46 72 52 64" stroke="#10B981" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Leaves */}
              <path d="M 52 64 Q 57 60 60 63 Q 56 67 52 64" fill="#84CC16" />
              <path d="M 50 72 Q 44 70 41 73 Q 46 75 50 72" fill="#10B981" />
            </motion.g>

            {/* STAGE 3: Young Tree 🌳 */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 2 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Trunk */}
              <path d="M 50 85 Q 48 68 51 50" stroke="#8B5E3C" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* Branches */}
              <path d="M 49 68 Q 40 60 38 52" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 50 58 Q 60 52 62 46" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Leaf clusters */}
              <circle cx="51" cy="46" r="8" fill="#166534" />
              <circle cx="38" cy="50" r="6" fill="#10B981" />
              <circle cx="62" cy="44" r="7" fill="#84CC16" />
            </motion.g>

            {/* STAGE 4: Full Tree 🌲 */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 3 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Strong Trunk */}
              <path d="M 50 85 Q 49 60 50 40" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none" />
              {/* Main Branches */}
              <path d="M 50 65 Q 36 55 32 45" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 50 56 Q 64 48 68 38" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 50 48 Q 42 38 45 30" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Full Canopy */}
              <circle cx="50" cy="34" r="12" fill="#166534" />
              <circle cx="32" cy="42" r="9" fill="#10B981" />
              <circle cx="68" cy="36" r="10" fill="#10B981" />
              <circle cx="43" cy="28" r="9" fill="#84CC16" />
              <circle cx="57" cy="28" r="8" fill="#84CC16" />
            </motion.g>

            {/* STAGE 5: Ecosystem 🌎 */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 4 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Earth/Atmosphere Orbit Ring */}
              <circle cx="50" cy="50" r="42" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" fill="none" className="opacity-60 ring-rotate" style={{ transformOrigin: '50px 50px' }} />
              {/* Orbiting Satellite Leaves */}
              <circle cx="50" cy="8" r="2.5" fill="#84CC16" />
              <circle cx="92" cy="50" r="2.5" fill="#10B981" />
              {/* Massive Tree */}
              <path d="M 50 85 Q 49 60 50 40" stroke="#8B5E3C" strokeWidth="6.5" strokeLinecap="round" fill="none" />
              <path d="M 50 65 Q 36 55 32 45" stroke="#8B5E3C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 50 56 Q 64 48 68 38" stroke="#8B5E3C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <circle cx="50" cy="34" r="13" fill="#166534" />
              <circle cx="32" cy="42" r="10" fill="#10B981" />
              <circle cx="68" cy="36" r="11" fill="#10B981" />
              <circle cx="43" cy="26" r="10" fill="#84CC16" />
              <circle cx="57" cy="26" r="9" fill="#84CC16" />
              {/* Sparkles / Glowing Bio-particles */}
              <circle cx="25" cy="30" r="1" fill="#84CC16" className="animate-ping" />
              <circle cx="75" cy="25" r="1" fill="#10B981" className="animate-ping" />
              <circle cx="68" cy="65" r="1.5" fill="#84CC16" className="animate-pulse" />
              <circle cx="28" cy="68" r="1.5" fill="#10B981" className="animate-pulse" />
            </motion.g>
          </svg>
        </div>

        {/* Text descriptions and progress tracking */}
        <div className="space-y-4">
          <div className="h-8 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-bold text-foreground"
              >
                {currentStageInfo.text}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium Progress Bar */}
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mx-auto border border-border/40">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((stage + 1) / 5) * 100}%` }}
              transition={{ duration: 0.2, ease: "linear" }}
            />
          </div>

          {/* Stage badge tracker */}
          <div className="flex justify-center gap-1.5">
            {STAGES.map((s, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx <= stage ? 'bg-primary scale-110' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
