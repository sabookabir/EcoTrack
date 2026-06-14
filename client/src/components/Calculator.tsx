import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../lib/supabase';
import { 
  Car, 
  Bike, 
  Bus, 
  TrendingDown, 
  Sparkles, 
  Save, 
  Info,
  Calendar,
  Zap,
  Utensils,
  ShoppingBag,
  Trash2,
  WifiOff,
  Train,
  Footprints,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalculatorProps {
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshProfile: () => void;
}

export default function Calculator({ triggerToast, refreshProfile }: CalculatorProps) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [car, setCar] = useState<number | ''>('');
  const [bike, setBike] = useState<number | ''>('');
  const [bus, setBus] = useState<number | ''>('');
  const [train, setTrain] = useState<number | ''>('');
  const [walking, setWalking] = useState<number | ''>('');
  const [electricity, setElectricity] = useState<number | ''>('');
  const [foodHabit, setFoodHabit] = useState<'vegetarian' | 'mixed' | 'non-vegetarian'>('mixed');
  const [shoppingHabit, setShoppingHabit] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [waste, setWaste] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [step, setStep] = useState<number>(1);

  const factors = {
    car: 0.18,
    bike: 0.05,
    bus: 0.08,
    train: 0.04,
    electricity: 0.85,
    food: { vegetarian: 1.5, mixed: 2.5, 'non-vegetarian': 4.5 },
    shopping: { low: 2.0, moderate: 5.0, high: 10.0 },
    waste: 1.2
  };

  const liveTransport = 
    (Number(car) || 0) * factors.car +
    (Number(bike) || 0) * factors.bike +
    (Number(bus) || 0) * factors.bus +
    (Number(train) || 0) * factors.train;
  
  const liveElectricity = (Number(electricity) || 0) * factors.electricity;
  const liveFood = factors.food[foodHabit];
  const liveShopping = factors.shopping[shoppingHabit];
  const liveWaste = (Number(waste) || 0) * factors.waste;
  
  const liveTotal = liveTransport + liveElectricity + liveFood + liveShopping + liveWaste;

  useEffect(() => {
    const checkOfflineQueue = () => {
      try {
        const queue = localStorage.getItem('ecotrack_offline_entries');
        if (queue) {
          const parsed = JSON.parse(queue);
          setPendingSyncCount(parsed.length);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkOfflineQueue();

    const syncOfflineLogs = async () => {
      try {
        const queue = localStorage.getItem('ecotrack_offline_entries');
        if (!queue) return;

        const parsed = JSON.parse(queue);
        if (parsed.length === 0) return;

        triggerToast(`Internet reconnected! Syncing ${parsed.length} pending entry...`, 'info');
        const headers = await getAuthHeaders();

        for (const item of parsed) {
          await axios.post(`${BACKEND_URL}/entries`, item, { headers });
        }

        localStorage.removeItem('ecotrack_offline_entries');
        setPendingSyncCount(0);
        triggerToast('All offline entries synchronized successfully!', 'success');
        refreshProfile();
      } catch (err) {
        console.error('Failed to sync offline logs:', err);
      }
    };

    window.addEventListener('online', syncOfflineLogs);
    return () => window.removeEventListener('online', syncOfflineLogs);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      entry_date: entryDate,
      transport_car: Number(car) || 0,
      transport_bike: Number(bike) || 0,
      transport_bus: Number(bus) || 0,
      transport_train: Number(train) || 0,
      transport_walking: Number(walking) || 0,
      electricity_kwh: Number(electricity) || 0,
      food_habit: foodHabit,
      shopping_habits: shoppingHabit,
      waste_kg: Number(waste) || 0,
    };

    if (!navigator.onLine) {
      try {
        const queue = localStorage.getItem('ecotrack_offline_entries');
        const parsedQueue = queue ? JSON.parse(queue) : [];
        const filtered = parsedQueue.filter((item: any) => item.entry_date !== entryDate);
        filtered.push(payload);
        
        localStorage.setItem('ecotrack_offline_entries', JSON.stringify(filtered));
        setPendingSyncCount(filtered.length);
        
        triggerToast('Offline mode: Carbon entry saved locally. Will sync when online.', 'info');
        setLoading(false);
        resetForm();
        setStep(1);
        return;
      } catch (err) {
        console.error('Local storage write failed:', err);
      }
    }

    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${BACKEND_URL}/entries`, payload, { headers });

      if (res.data.success) {
        const points = res.data.data.pointsAwarded;
        const msg = points > 0 
          ? `Daily footprint logged! You earned ${points} XP!` 
          : 'Footprint entry updated successfully.';
        triggerToast(msg, 'success');
        resetForm();
        setStep(1);
        refreshProfile();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to submit entry. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCar('');
    setBike('');
    setBus('');
    setTrain('');
    setWalking('');
    setElectricity('');
    setWaste('');
  };

  const steps = [
    { id: 1, name: 'Transport', icon: Car },
    { id: 2, name: 'Electricity', icon: Zap },
    { id: 3, name: 'Diet Type', icon: Utensils },
    { id: 4, name: 'Shopping', icon: ShoppingBag },
    { id: 5, name: 'Waste Weight', icon: Trash2 },
    { id: 6, name: 'Results Overview', icon: Sparkles },
  ];

  const handleNext = () => {
    if (step < 6) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  return (
    <div className="max-w-4xl mx-auto fade-in">
      
      {/* Pending Offline Logs Banner */}
      {pendingSyncCount > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl p-4.5 text-xs flex justify-between items-center animate-pulse">
          <span className="flex items-center gap-2 font-bold">
            <WifiOff className="w-4.5 h-4.5 text-amber-500" />
            Offline Mode: {pendingSyncCount} carbon log(s) cached locally. They will sync automatically once you are online.
          </span>
          <span className="text-[9px] bg-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase border border-amber-500/30">Sync Pending</span>
        </div>
      )}

      {/* Main Onboarding Wizard frame */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

        {/* Wizard Header details */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">Onboarding wizard</h2>
            <p className="text-[11px] text-muted-foreground mt-1 font-semibold">Step-by-step entry of daily utility consumption and mobility metrics.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted border border-border px-4 py-2.5 rounded-2xl shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <input 
              type="date" 
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-foreground font-bold" 
            />
          </div>
        </div>

        {/* Progress Tracker bar */}
        <div className="flex justify-between items-center mb-10 bg-muted/30 p-2.5 rounded-2xl border border-border/60 overflow-x-auto gap-2">
          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer bg-transparent border-none outline-none focus:ring-0"
                >
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10 scale-110 font-bold'
                      : isCompleted
                        ? 'bg-primary/20 border-primary/20 text-primary font-bold'
                        : 'bg-background border-border text-muted-foreground'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4.5 h-4.5 text-primary" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[8px] font-extrabold tracking-wider uppercase hidden sm:inline ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>{s.name}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`h-[2px] flex-grow min-w-[12px] bg-border/40 mx-1 transition-all duration-300 ${
                    isCompleted ? 'bg-primary/40' : ''
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form area with Framer Motion slide anims */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22 }}
            >
              
              {/* STEP 1: Transportation */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Car className="w-4 h-4" /> Step 1: Daily Transportation Commute
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Select travel metrics logged today across transport categories.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-muted/30 p-4.5 rounded-2xl border border-border/60">
                      <label className="text-[11px] font-bold text-muted-foreground block mb-2">Car Transit Distance (km)</label>
                      <input
                        type="number"
                        min="0"
                        value={car}
                        onChange={(e) => setCar(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground shadow-sm focus:outline-none"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="bg-muted/30 p-4.5 rounded-2xl border border-border/60">
                      <label className="text-[11px] font-bold text-muted-foreground block mb-2">Motorbike / Scooter (km)</label>
                      <input
                        type="number"
                        min="0"
                        value={bike}
                        onChange={(e) => setBike(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground shadow-sm focus:outline-none"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="bg-muted/30 p-4.5 rounded-2xl border border-border/60">
                      <label className="text-[11px] font-bold text-muted-foreground block mb-2">Bus Transit Distance (km)</label>
                      <input
                        type="number"
                        min="0"
                        value={bus}
                        onChange={(e) => setBus(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground shadow-sm focus:outline-none"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="bg-muted/30 p-4.5 rounded-2xl border border-border/60">
                      <label className="text-[11px] font-bold text-muted-foreground block mb-2">Train Commute (km)</label>
                      <input
                        type="number"
                        min="0"
                        value={train}
                        onChange={(e) => setTrain(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground shadow-sm focus:outline-none"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="bg-muted/30 p-4.5 rounded-2xl border border-border/60 md:col-span-2">
                      <label className="text-[11px] font-bold text-muted-foreground block mb-2">Walking / Cycling (km)</label>
                      <input
                        type="number"
                        min="0"
                        value={walking}
                        onChange={(e) => setWalking(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground shadow-sm focus:outline-none"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Electricity Usage */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Step 2: Household Electricity Usage
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Toggle standard home grids power consumption today.</p>
                  </div>

                  <div className="bg-muted/30 p-6 rounded-2xl border border-border/60 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-bold text-muted-foreground">Power Consumed (kWh)</label>
                        <span className="text-xs font-black text-amber-500">{electricity || 0} kWh</span>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={electricity || 0}
                        onChange={(e) => setElectricity(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-background rounded-full appearance-none cursor-pointer border border-border/80"
                      />
                      <div className="flex justify-between text-[9px] text-muted-foreground font-semibold mt-1">
                        <span>0 kWh (Sustainable/Solar)</span>
                        <span>50 kWh (Avg Family)</span>
                        <span>100 kWh (High)</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">Manual Entry override</label>
                      <input
                        type="number"
                        min="0"
                        value={electricity}
                        onChange={(e) => setElectricity(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="bg-background border border-border focus:border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground shadow-sm focus:outline-none max-w-xs"
                        placeholder="Enter manual kWh"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Food Habits */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <Utensils className="w-4 h-4" /> Step 3: Diet & Eating Habits
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Select your dietary profile logged for today.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                    {/* Veg */}
                    <button
                      type="button"
                      onClick={() => setFoodHabit('vegetarian')}
                      className={`btn-choice text-left p-6 rounded-3xl border text-sm flex flex-col justify-between h-48 cursor-pointer shadow-sm ${
                        foodHabit === 'vegetarian'
                          ? 'border-emerald-500 bg-emerald-500/[0.03] ring-1 ring-emerald-500'
                          : 'border-border bg-card hover:bg-muted/20'
                      }`}
                    >
                      <span className="text-2xl">🌱</span>
                      <div>
                        <h4 className="font-extrabold text-foreground">Vegetarian Meals</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-normal">Organic vegetable, dairy, or egg-based meals. Represents the lowest carbon intensity footprint.</p>
                      </div>
                    </button>

                    {/* Mixed */}
                    <button
                      type="button"
                      onClick={() => setFoodHabit('mixed')}
                      className={`btn-choice text-left p-6 rounded-3xl border text-sm flex flex-col justify-between h-48 cursor-pointer shadow-sm ${
                        foodHabit === 'mixed'
                          ? 'border-primary bg-primary/[0.03] ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/20'
                      }`}
                    >
                      <span className="text-2xl">🥗</span>
                      <div>
                        <h4 className="font-extrabold text-foreground">Mixed diet</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-normal">Balanced combination of grains, greens, and poultry. Moderate carbon profile.</p>
                      </div>
                    </button>

                    {/* Meat */}
                    <button
                      type="button"
                      onClick={() => setFoodHabit('non-vegetarian')}
                      className={`btn-choice text-left p-6 rounded-3xl border text-sm flex flex-col justify-between h-48 cursor-pointer shadow-sm ${
                        foodHabit === 'non-vegetarian'
                          ? 'border-rose-500 bg-rose-500/[0.03] ring-1 ring-rose-500'
                          : 'border-border bg-card hover:bg-muted/20'
                      }`}
                    >
                      <span className="text-2xl">🥩</span>
                      <div>
                        <h4 className="font-extrabold text-foreground">Non-Vegetarian</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-normal">Frequent red meat, beef, or dairy intensive selections. Highest greenhouse impact.</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Shopping Habits */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-purple-500 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> Step 4: Consumer Shopping Habits
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Define your packaging/volume rate today.</p>
                  </div>

                  <div className="bg-muted/30 p-6 rounded-2xl border border-border/60 max-w-xl mx-auto space-y-4">
                    <label className="text-[11px] font-bold text-muted-foreground block">Purchases Volume Level</label>
                    <div className="grid grid-cols-3 gap-3.5 p-1 bg-background rounded-xl border border-border">
                      {(['low', 'moderate', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setShoppingHabit(level)}
                          className={`py-2.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer capitalize ${
                            shoppingHabit === level
                              ? 'bg-purple-600 text-white shadow shadow-purple-600/10'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-semibold mt-2 block text-center uppercase tracking-wider">
                      Target parameter: {shoppingHabit === 'low' ? '🌱 Eco Friendly (Minimal Carbon)' : shoppingHabit === 'moderate' ? '⚡ Standard volume' : '⚠️ Heavy buyer (Fossil Fuel impact)'}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 5: Waste Generation */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-sky-500 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Step 5: Household Waste weight
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Detail garbage weight generated today in kilograms.</p>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 max-w-xl mx-auto">
                    <label className="text-[11px] font-bold text-muted-foreground block mb-2">Waste Weight (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={waste}
                      onChange={(e) => setWaste(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full bg-background border border-border focus:border-sky-500/50 rounded-xl px-3.5 py-2.5 text-xs text-foreground shadow-sm focus:outline-none"
                      placeholder="0.0"
                    />
                    <span className="text-[9px] text-muted-foreground font-semibold mt-2.5 block">Estimated organic/non-recyclable waste bags put out today.</span>
                  </div>
                </div>
              )}

              {/* STEP 6: Results Overview */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Step 6: Calculations Overview & Impact
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Review impact estimations and save your carbon footprint for today.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    
                    {/* circular score visual */}
                    <div className="bg-background border border-border p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden md:col-span-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Estimated Footprint</span>
                      <div className="w-28 h-28 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center mb-3">
                        <div className="text-center">
                          <h2 className="text-3xl font-black text-primary tracking-tighter">{liveTotal.toFixed(1)}</h2>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">kg CO₂e</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                        <TrendingDown className="w-3.5 h-3.5 text-primary" />
                        <span>Target limit: &lt; 3.0 kg</span>
                      </div>
                    </div>

                    {/* progress breakdown */}
                    <div className="bg-background border border-border p-6 rounded-3xl md:col-span-2 space-y-3.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Source breakdown shares</span>
                      
                      {/* Transport */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><Footprints className="w-3 h-3 text-sky-500" /> Transit</span>
                          <span>{liveTransport.toFixed(1)} kg</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                          <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${Math.min((liveTransport / (liveTotal || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>

                      {/* Electricity */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Utilities</span>
                          <span>{liveElectricity.toFixed(1)} kg</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                          <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${Math.min((liveElectricity / (liveTotal || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>

                      {/* Food */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><Utensils className="w-3 h-3 text-emerald-500" /> Diet</span>
                          <span>{liveFood.toFixed(1)} kg</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min((liveFood / (liveTotal || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>

                      {/* Shopping */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-purple-500" /> Shopping</span>
                          <span>{liveShopping.toFixed(1)} kg</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                          <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${Math.min((liveShopping / (liveTotal || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>

                      {/* Waste */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><Trash2 className="w-3 h-3 text-rose-500" /> Waste</span>
                          <span>{liveWaste.toFixed(1)} kg</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                          <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${Math.min((liveWaste / (liveTotal || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Wizard Navigation Panel */}
          <div className="pt-6 border-t border-border flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 bg-muted hover:bg-border text-foreground rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-border"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div /> // placeholder spacer
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 disabled:opacity-50 text-primary-foreground rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary/10"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Daily Log
                  </>
                )}
              </button>
            )}
          </div>

        </form>
      </div>

    </div>
  );
}
