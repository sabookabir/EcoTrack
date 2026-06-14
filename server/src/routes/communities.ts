import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { localDb } from '../utils/localDb';
import logger from '../utils/logger';

const router = Router();

// GET all communities
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const teams = localDb.getTeams();

    // Gather all user IDs across teams to fetch their details from Supabase in a single batch
    const allUserIds = Array.from(new Set(teams.flatMap(t => t.members)));
    
    let userProfiles: Record<string, { full_name: string | null; email: string }> = {};

    if (allUserIds.length > 0) {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .in('id', allUserIds);

      if (error) throw error;
      
      users.forEach(u => {
        userProfiles[u.id] = {
          full_name: u.full_name,
          email: u.email
        };
      });
    }

    const responseData = teams.map(team => ({
      id: team.id,
      name: team.name,
      type: team.type,
      collegeName: team.collegeName,
      points: team.points,
      createdAt: team.createdAt,
      members: team.members.map(memberId => ({
        id: memberId,
        name: userProfiles[memberId]?.full_name || 'Anonymous User',
        email: userProfiles[memberId]?.email || ''
      }))
    }));

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Communities lists retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
});

// POST create community team
router.post('/create', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and group type are required'
      });
    }

    // Get user details
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('college_name')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const collegeName = user.college_name || 'Individual';
    const team = localDb.createTeam(name, type, collegeName, userId);

    // Reward Community Contributor XP
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
      
    const currentPoints = profile?.points || 0;
    const updatedPoints = currentPoints + 50; // 50 XP reward for creating a community

    await supabaseAdmin
      .from('users')
      .update({ points: updatedPoints })
      .eq('id', userId);

    // Unlock Community Contributor badge in Supabase
    const { data: badge } = await supabaseAdmin
      .from('achievements')
      .select('id')
      .eq('name', 'Community Contributor')
      .maybeSingle();

    if (badge) {
      await supabaseAdmin
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: badge.id
        })
        .maybeSingle(); // ignore key conflicts if already unlocked
    }

    res.status(201).json({
      success: true,
      data: team,
      message: `Successfully created ${type} "${name}"! You earned +50 XP and unlocked the Community Contributor Badge!`
    });
  } catch (err) {
    next(err);
  }
});

// POST join community team
router.post('/join/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const teamId = req.params.id;

    const team = localDb.joinTeam(teamId, userId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Reward Community Contributor XP
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    const currentPoints = profile?.points || 0;
    const updatedPoints = currentPoints + 25; // 25 XP reward for joining a team

    await supabaseAdmin
      .from('users')
      .update({ points: updatedPoints })
      .eq('id', userId);

    // Unlock Community Contributor badge in Supabase
    const { data: badge } = await supabaseAdmin
      .from('achievements')
      .select('id')
      .eq('name', 'Community Contributor')
      .maybeSingle();

    if (badge) {
      await supabaseAdmin
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: badge.id
        })
        .maybeSingle();
    }

    res.status(200).json({
      success: true,
      data: team,
      message: `Successfully joined ${team.type} "${team.name}"! You earned +25 XP!`
    });
  } catch (err) {
    next(err);
  }
});

// GET community forest tree grid
router.get('/forest/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const teamId = req.params.id;
    const team = localDb.getTeam(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Fetch members and their current XP scores from Supabase
    const { data: members, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, college_name, points')
      .in('id', team.members);

    if (error) throw error;

    // Order members by points for ranking placement
    const rankedMembers = (members || []).sort((a, b) => (b.points || 0) - (a.points || 0));

    res.status(200).json({
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
          type: team.type,
          points: team.points
        },
        forest: rankedMembers
      },
      message: 'Community forest data loaded successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
