import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { generateDynamicChallenges } from '../utils/challengeGenerator';
import { localDb } from '../utils/localDb';
import { unlockBadge } from '../utils/streakManager';
import logger from '../utils/logger';

const router = Router();

// GET all challenges (includes user join status)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // Fetch user details for college-specific challenge generation
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('college_name')
      .eq('id', userId)
      .single();

    // Trigger dynamic challenge generation cycle
    await generateDynamicChallenges(userId, userProfile?.college_name || '');

    // Fetch all challenges
    const { data: rawChallenges, error: chalErr } = await supabaseAdmin
      .from('challenges')
      .select('*');

    if (chalErr) throw chalErr;

    // Filter expired challenges and clean up description tag
    const nowStr = new Date().toISOString().split('T')[0];
    const challenges = (rawChallenges || []).filter(chal => {
      const match = chal.description.match(/\[Expires:\s*([\d\-]+)\]/);
      if (match) {
        const expiryDate = match[1];
        if (nowStr > expiryDate) {
          return false; // Filter out expired challenge
        }
      }
      return true;
    }).map(chal => {
      // Remove the expiry tag from description for clean display
      return {
        ...chal,
        description: chal.description.replace(/\s*\[Expires:\s*[\d\-]+\]/, '').trim()
      };
    });

    // Fetch user joined challenges
    const { data: joined, error: joinedErr } = await supabaseAdmin
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId);

    if (joinedErr) throw joinedErr;

    // Merge status
    const result = challenges.map((chal) => {
      const userChal = joined.find((jc) => jc.challenge_id === chal.id);
      return {
        ...chal,
        status: userChal ? userChal.status : 'not_started',
        started_at: userChal ? userChal.started_at : null,
        completed_at: userChal ? userChal.completed_at : null,
      };
    });

    // Fetch achievements list
    const { data: achievements, error: achErr } = await supabaseAdmin
      .from('achievements')
      .select('*');

    if (achErr) throw achErr;

    // Fetch user unlocked achievements
    const { data: userAch, error: uachErr } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (uachErr) throw uachErr;

    const achievementsResult = achievements.map((ach) => {
      const unlocked = userAch.some((ua) => ua.achievement_id === ach.id);
      return {
        ...ach,
        unlocked,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        challenges: result,
        achievements: achievementsResult,
      },
      message: 'Challenges and achievements fetched successfully',
    });
  } catch (err) {
    next(err);
  }
});

// POST join a challenge
router.post('/join/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const challengeId = req.params.id;

    // Check if challenge exists
    const { data: challenge, error: chalErr } = await supabaseAdmin
      .from('challenges')
      .select('id')
      .eq('id', challengeId)
      .single();

    if (chalErr || !challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    // Insert user_challenge
    const { data, error } = await supabaseAdmin
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this challenge',
        });
      }
      throw error;
    }

    // Log in audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'join_challenge',
      details: { challenge_id: challengeId }
    });

    res.status(200).json({
      success: true,
      data,
      message: 'Successfully joined the challenge! Keep tracking your footprint.',
    });
  } catch (err) {
    next(err);
  }
});

// POST complete a challenge
router.post('/complete/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const challengeId = req.params.id;

    // Check if active
    const { data: userChal, error: jcErr } = await supabaseAdmin
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (jcErr || !userChal) {
      return res.status(404).json({
        success: false,
        message: 'Active challenge registration not found for this user',
      });
    }

    if (userChal.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Challenge already completed',
      });
    }

    // Get challenge points
    const { data: challenge, error: chalErr } = await supabaseAdmin
      .from('challenges')
      .select('points, title')
      .eq('id', challengeId)
      .single();

    if (chalErr || !challenge) {
      throw new Error('Challenge details not found');
    }

    // 1. Update user challenge status
    const { error: updateErr } = await supabaseAdmin
      .from('user_challenges')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', userChal.id);

    if (updateErr) throw updateErr;

    // 2. Award points to user profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (profErr) throw profErr;

    const newPoints = (profile.points || 0) + challenge.points;
    await supabaseAdmin
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    // 3. Log audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'complete_challenge',
      details: { challenge_id: challengeId, points_earned: challenge.points }
    });

    // 3.5 Update community team scores & challenge streaks
    localDb.addTeamPoints(userId, challenge.points);
    const currentStreaks = localDb.getStreaks(userId);
    localDb.updateStreaks(userId, {
      challengeStreak: currentStreaks.challengeStreak + 1,
      lastChallengeCompleted: new Date().toISOString().split('T')[0]
    });

    // Award Challenge Finisher badge
    await unlockBadge(userId, 'Challenge Finisher');

    // 4. Check achievements thresholds
    // Retrieve how many challenges completed
    const { count: completedCount, error: countErr } = await supabaseAdmin
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    let unlockedBadge = null;

    if (!countErr && completedCount) {
      // Achievement Check 1: Green Warrior (3 challenges and 300 points)
      if (completedCount >= 3 && newPoints >= 300) {
        const { data: warriorAch } = await supabaseAdmin
          .from('achievements')
          .select('id, name')
          .eq('name', 'Green Warrior')
          .maybeSingle();

        if (warriorAch) {
          const { error: insertAchErr } = await supabaseAdmin
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: warriorAch.id
            });
          
          if (!insertAchErr) {
            unlockedBadge = warriorAch.name;
          }
        }
      }

      // Check Challenge Master
      if (completedCount >= 10) {
        await unlockBadge(userId, 'Challenge Master');
      }

      // Achievement Check 2: Sustainability Champion (1000 points)
      if (newPoints >= 1000) {
        const { data: champAch } = await supabaseAdmin
          .from('achievements')
          .select('id, name')
          .eq('name', 'Sustainability Champion')
          .maybeSingle();

        if (champAch) {
          const { error: insertAchErr } = await supabaseAdmin
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: champAch.id
            });

          if (!insertAchErr) {
            unlockedBadge = champAch.name;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        pointsEarned: challenge.points,
        newTotalPoints: newPoints,
        unlockedBadge
      },
      message: `Congratulations! You completed '${challenge.title}' and earned ${challenge.points} points.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
