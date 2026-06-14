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
  Footprints
} from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* Column 1 & 2: Form */}
      <div className="lg:col-span-2 bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

        {pendingSyncCount > 0 && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-4 text-xs flex justify-between items-center animate-pulse">
            <span className="flex items-center gap-2 font-bold">
              <WifiOff className="w-4 h-4" />
              You have {pendingSyncCount} offline entry queued for synchronization.
            </span>
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold uppercase border border-amber-500/30">Offline Pending</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">Daily Footprint Logs</h2>
            <p className="text-xs text-zinc-400 mt-1">Select your tracking date and update your daily usage.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <input 
              type="date" 
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-zinc-50 font-bold" 
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Transportation */}
          <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/60">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 pb-3 border-b border-zinc-900 mb-4 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-500" /> Commuting & Transit Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1.5">Car Distance (km)</label>
                <input
                  type="number"
                  min="0"
                  value={car}
                  onChange={(e) => setCar(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#131317] border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-zinc-700"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1.5">Motorbike / Scooter (km)</label>
                <input
                  type="number"
                  min="0"
                  value={bike}
                  onChange={(e) => setBike(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#131317] border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-zinc-700"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1.5">Bus Travel (km)</label>
                <input
                  type="number"
                  min="0"
                  value={bus}
                  onChange={(e) => setBus(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#131317] border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-zinc-700"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1.5">Train Commute (km)</label>
                <input
                  type="number"
                  min="0"
                  value={train}
                  onChange={(e) => setTrain(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#131317] border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-zinc-700"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1.5">Walking / Cycling (km)</label>
                <input
                  type="number"
                  min="0"
                  value={walking}
                  onChange={(e) => setWalking(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#131317] border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-zinc-700"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Utilities & Waste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/60">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 pb-3 border-b border-zinc-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Utility Electricity
              </h3>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1.5">Power Consumed (kWh)</label>
              <input
                type="number"
                min="0"
                value={electricity}
                onChange={(e) => setElectricity(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                className="w-full bg-[#131317] border border-zinc-800 focus:border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-zinc-700"
                placeholder="0"
              />
            </div>

            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/60">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 pb-3 border-b border-zinc-900 mb-4 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" /> Waste & Garbage
              </h3>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1.5">Waste Weight (kg)</label>
              <input
                type="number"
                min="0"
                value={waste}
                onChange={(e) => setWaste(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                className="w-full bg-[#131317] border border-zinc-800 focus:border-rose-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all placeholder-zinc-700"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Section 3: Lifestyle Habits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/60">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 pb-3 border-b border-zinc-900 mb-4 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-500" /> Dietary Footprint
              </h3>
              <label className="text-[11px] font-bold text-zinc-500 block mb-2">Food Habit Type</label>
              <div className="grid grid-cols-3 gap-2 bg-[#131317] p-1 rounded-xl border border-zinc-800">
                {(['vegetarian', 'mixed', 'non-vegetarian'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFoodHabit(type)}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer capitalize ${
                      foodHabit === type
                        ? 'bg-emerald-600 text-white shadow shadow-emerald-600/15'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {type.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/60">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 pb-3 border-b border-zinc-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-500" /> Shopping Habits
              </h3>
              <label className="text-[11px] font-bold text-zinc-500 block mb-2">Purchase Volume</label>
              <div className="grid grid-cols-3 gap-2 bg-[#131317] p-1 rounded-xl border border-zinc-800">
                {(['low', 'moderate', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setShoppingHabit(level)}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer capitalize ${
                      shoppingHabit === level
                        ? 'bg-purple-600 text-white shadow shadow-purple-600/15'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-900 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl px-6 py-3 font-bold shadow-md shadow-emerald-600/15 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Daily Log
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Column 3: Live Preview Panel */}
      <div className="bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm lg:sticky lg:top-8 flex flex-col justify-between overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div>
          <h2 className="text-lg font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
            Impact Preview
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Real-time calculations based on inputs.</p>
        </div>

        {/* Circular Display */}
        <div className="my-8 text-center bg-zinc-950/40 rounded-2xl p-6 border border-zinc-900 flex flex-col items-center justify-center relative">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Estimated Footprint</span>
          
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-emerald-500/30 flex items-center justify-center mb-4 relative shadow-lg shadow-emerald-500/[0.02] hover:border-emerald-500/60 transition-all">
            {/* Value */}
            <div className="text-center">
              <h1 className="text-4xl font-black text-emerald-500 tracking-tighter">
                {liveTotal.toFixed(1)}
              </h1>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block -mt-1">kg CO2e</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            <span>Sustainable Target limit: &lt; 3.0 kg</span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Breakdown Share</h3>
          
          {/* Transport */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-zinc-400 mb-1">
              <span className="flex items-center gap-1"><Footprints className="w-3 h-3 text-blue-500" /> Transportation</span>
              <span>{liveTransport.toFixed(1)} kg</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((liveTransport / (liveTotal || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Electricity */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-zinc-400 mb-1">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Electricity</span>
              <span>{liveElectricity.toFixed(1)} kg</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="bg-yellow-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((liveElectricity / (liveTotal || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Food */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-zinc-400 mb-1">
              <span className="flex items-center gap-1"><Utensils className="w-3 h-3 text-emerald-500" /> Diet Type</span>
              <span>{liveFood.toFixed(1)} kg</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((liveFood / (liveTotal || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Shopping */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-zinc-400 mb-1">
              <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-purple-500" /> Shopping</span>
              <span>{liveShopping.toFixed(1)} kg</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((liveShopping / (liveTotal || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Waste */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-zinc-400 mb-1">
              <span className="flex items-center gap-1"><Trash2 className="w-3 h-3 text-rose-500" /> Waste Weight</span>
              <span>{liveWaste.toFixed(1)} kg</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((liveWaste / (liveTotal || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Fact Card */}
        <div className="mt-6 bg-[#131317] border border-zinc-800 text-zinc-400 rounded-xl p-4 text-xs flex gap-2.5 items-start">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
          <span>Calculations automatically adjust based on custom emission factors. Logs synchronize automatically when active.</span>
        </div>

      </div>

    </div>
  );
}
