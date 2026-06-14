import { localDb, UserStreaks } from './localDb';
import { supabaseAdmin } from '../config/supabase';
import logger from './logger';

export async function processLogGamification(userId: string, entryDate: string, currentEntryCO2: number, emissionsBreakdown: any) {
  try {
    logger.info(`Evaluating gamification triggers for user ${userId} on date ${entryDate}...`);

    // 1. Fetch historical entries for streak & pattern calculations
    const { data: entries, error } = await supabaseAdmin
      .from('carbon_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (error || !entries) {
      logger.error(`Could not calculate streaks: ${error?.message || 'No entries found'}`);
      return;
    }

    const totalLogs = entries.length;
    const streaks = localDb.getStreaks(userId);
    const updatedStreaks: Partial<UserStreaks> = {};

    // --- DAILY ACTIVITY STREAK ---
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const lastLogDate = streaks.lastDailyLog;

    if (lastLogDate === yesterdayStr) {
      updatedStreaks.dailyStreak = streaks.dailyStreak + 1;
      updatedStreaks.lastDailyLog = entryDate;
    } else if (lastLogDate === todayStr) {
      // Already logged today, maintain streak
      updatedStreaks.dailyStreak = streaks.dailyStreak;
    } else {
      // Streak broken or first entry
      updatedStreaks.dailyStreak = 1;
      updatedStreaks.lastDailyLog = entryDate;
    }

    // --- EMISSION REDUCTION STREAK & CARBON REDUCER ---
    if (totalLogs >= 2) {
      const pastEntries = entries.slice(1);
      const avgPastCO2 = pastEntries.reduce((sum, e) => sum + Number(e.total_co2_kg), 0) / pastEntries.length;
      
      // If current emissions is 20% or more lower than historical average
      if (currentEntryCO2 <= avgPastCO2 * 0.8) {
        updatedStreaks.emissionStreak = streaks.emissionStreak + 1;
        await unlockBadge(userId, 'Carbon Reducer');
      } else {
        updatedStreaks.emissionStreak = 0;
      }
    }

    // Save streaks
    const currentStreaks = localDb.updateStreaks(userId, updatedStreaks);

    // --- BADGE EVALUATIONS ---
    
    // First Entry
    if (totalLogs === 1) {
      await unlockBadge(userId, 'First Carbon Entry');
    }

    // 7-Day, 30-Day, 100-Day streaks
    if (currentStreaks.dailyStreak >= 7) {
      await unlockBadge(userId, '7-Day Streak');
    }
    if (currentStreaks.dailyStreak >= 30) {
      await unlockBadge(userId, '30-Day Streak');
    }
    if (currentStreaks.dailyStreak >= 100) {
      await unlockBadge(userId, '100-Day Streak');
    }
    if (currentStreaks.dailyStreak >= 14) {
      await unlockBadge(userId, 'Consistency King');
    }

    // Cycling Champion (Walking / Cycling > 0 in 5 entries)
    const activeCommutes = entries.filter(e => Number(e.transport_walking) > 0 || Number(e.transport_bike) > 0).length;
    if (activeCommutes >= 5) {
      await unlockBadge(userId, 'Cycling Champion');
    }

    // Public Transport Hero (Train / Bus > 0 in 5 entries)
    const publicCommutes = entries.filter(e => Number(e.transport_bus) > 0 || Number(e.transport_train) > 0).length;
    if (publicCommutes >= 5) {
      await unlockBadge(userId, 'Public Transport Hero');
    }

    // Energy Saver (Electricity < 10 kWh in 7 entries)
    const energySaveDays = entries.filter(e => Number(e.electricity_kwh) < 10 && Number(e.electricity_kwh) > 0).length;
    if (energySaveDays >= 7) {
      await unlockBadge(userId, 'Energy Saver');
    }

    // --- COLLECTIBLES UNLOCKS ---
    if (currentStreaks.dailyStreak >= 3) {
      localDb.addCollectible(userId, {
        id: 'seedling_sprout',
        type: 'plant',
        name: 'Seedling Sprout',
        rarity: 'Common',
        description: 'Unlocked by maintaining a 3-day daily logging streak.'
      });
    }

    if (currentStreaks.dailyStreak >= 7) {
      localDb.addCollectible(userId, {
        id: 'oak_sapling',
        type: 'tree',
        name: 'Oak Sapling',
        rarity: 'Rare',
        description: 'Unlocked by maintaining a 7-day daily logging streak.'
      });
    }

    if (currentStreaks.dailyStreak >= 15) {
      localDb.addCollectible(userId, {
        id: 'bonsai_tree',
        type: 'tree',
        name: 'Bonsai Tree',
        rarity: 'Epic',
        description: 'Unlocked by maintaining a 15-day daily logging streak.'
      });
    }

    // Check carbon saved totals to unlock Redwood
    const totalCO2Saved = entries.reduce((sum, e) => sum + Math.max(0, 8.5 - Number(e.total_co2_kg)), 0);
    if (totalCO2Saved >= 50) {
      localDb.addCollectible(userId, {
        id: 'redwood_sapling',
        type: 'artifact',
        name: 'Redwood Sapling',
        rarity: 'Legendary',
        description: 'Unlocked by collectively saving 50kg of CO₂ emissions relative to average baselines.'
      });
    }

    // General forest checks for Forest Builder badge
    const collectibles = localDb.getCollectibles(userId);
    if (collectibles.length >= 5) {
      await unlockBadge(userId, 'Forest Builder');
    }

  } catch (err) {
    logger.error(`Error in log gamification: ${(err as Error).message}`);
  }
}

// Unlock badge utility
export async function unlockBadge(userId: string, badgeName: string) {
  try {
    const { data: badge } = await supabaseAdmin
      .from('achievements')
      .select('id, name, points_required')
      .eq('name', badgeName)
      .maybeSingle();

    if (!badge) return;

    // Check if user already unlocked it
    const { data: existing } = await supabaseAdmin
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', badge.id)
      .maybeSingle();

    if (existing) return; // already unlocked

    // Save achievement unlock
    await supabaseAdmin
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: badge.id
      });

    // Reward points for unlocking
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userProfile) {
      const award = 100; // default 100 XP for achievements
      await supabaseAdmin
        .from('users')
        .update({ points: (userProfile.points || 0) + award })
        .eq('id', userId);

      logger.info(`User ${userId} unlocked badge '${badgeName}' and earned +${award} XP.`);
    }
  } catch (err) {
    logger.error(`Failed to unlock badge '${badgeName}': ${(err as Error).message}`);
  }
}
