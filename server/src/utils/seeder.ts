import { supabaseAdmin } from '../config/supabase';
import logger from './logger';

export async function seedAchievements() {
  try {
    logger.info('Verifying database achievements seeding...');
    
    // Fetch existing
    const { data: existing, error } = await supabaseAdmin
      .from('achievements')
      .select('name');
      
    if (error) {
      logger.error(`Failed to fetch achievements for seeding: ${error.message}`);
      return;
    }
    
    const existingNames = new Set(existing?.map(a => a.name) || []);
    
    const badgesToSeed = [
      { name: 'First Carbon Entry', description: 'Log your very first carbon footprint entry.', points_required: 0, badge_url: 'first_entry' },
      { name: '7-Day Streak', description: 'Log your daily footprint 7 days in a row.', points_required: 100, badge_url: 'streak_7' },
      { name: '30-Day Streak', description: 'Log your daily footprint 30 days in a row.', points_required: 300, badge_url: 'streak_30' },
      { name: '100-Day Streak', description: 'Log your daily footprint 100 days in a row.', points_required: 1000, badge_url: 'streak_100' },
      { name: 'Challenge Finisher', description: 'Complete your first green mission challenge.', points_required: 150, badge_url: 'challenge_finisher' },
      { name: 'Challenge Master', description: 'Complete 10 green mission challenges.', points_required: 800, badge_url: 'challenge_master' },
      { name: 'Public Transport Hero', description: 'Log bus or train transit distances 5 times.', points_required: 250, badge_url: 'transport_hero' },
      { name: 'Cycling Champion', description: 'Log walking or cycling distances 5 times.', points_required: 200, badge_url: 'cycling_champion' },
      { name: 'Energy Saver', description: 'Log home power below average for 7 consecutive entries.', points_required: 350, badge_url: 'energy_saver' },
      { name: 'Community Contributor', description: 'Create or join a community team or eco club.', points_required: 150, badge_url: 'community_contributor' },
      { name: 'AI Learner', description: 'Ask EcoGuide AI for recommendations 5 times.', points_required: 100, badge_url: 'ai_learner' },
      { name: 'Top 10 Leaderboard', description: 'Reach top 10 rankings on the global eco leaderboard.', points_required: 500, badge_url: 'top_10' },
      { name: 'Top 3 Leaderboard', description: 'Reach top 3 rankings on the global eco leaderboard.', points_required: 1000, badge_url: 'top_3' },
      { name: 'Monthly Champion', description: 'Finish a month with below average emissions.', points_required: 1200, badge_url: 'monthly_champion' },
      { name: 'Forest Builder', description: 'Unlock 5 nature collectibles.', points_required: 600, badge_url: 'forest_builder' },
      { name: 'Carbon Reducer', description: 'Reduce daily emissions by 20% compared to baseline.', points_required: 400, badge_url: 'carbon_reducer' },
      { name: 'Early Adopter', description: 'Register on EcoTrack platform early.', points_required: 0, badge_url: 'early_adopter' },
      { name: 'Consistency King', description: 'Log utility stats consistently for 14 straight days.', points_required: 500, badge_url: 'consistency_king' },
      { name: 'Sustainability Mentor', description: 'Gain over 1500 XP points.', points_required: 1500, badge_url: 'sustainability_mentor' },
      { name: 'Eco Ambassador', description: 'Help your campus or team gain 5000 collective points.', points_required: 2500, badge_url: 'eco_ambassador' },
      { name: 'Planet Protector', description: 'Complete all milestones and reach Planet Guardian Elite status.', points_required: 4000, badge_url: 'planet_protector' }
    ];
    
    const toInsert = badgesToSeed.filter(b => !existingNames.has(b.name));
    
    if (toInsert.length > 0) {
      logger.info(`Seeding ${toInsert.length} new advanced achievements into database...`);
      const { error: insertErr } = await supabaseAdmin
        .from('achievements')
        .insert(toInsert);
        
      if (insertErr) {
        logger.error(`Error inserting achievements seed: ${insertErr.message}`);
      } else {
        logger.info('Achievements seeding complete!');
      }
    } else {
      logger.info('All achievements already exist. Seeding skipped.');
    }
  } catch (err) {
    logger.error(`Catastrophic seeder error: ${(err as Error).message}`);
  }
}
