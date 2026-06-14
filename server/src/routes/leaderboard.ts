import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

const router = Router();

// GET leaderboard data
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // 1. Fetch top users globally by points
    const { data: globalUsers, error: globalErr } = await supabaseAdmin
      .from('users')
      .select('id, full_name, college_name, city, points')
      .order('points', { ascending: false })
      .limit(10);

    if (globalErr) throw globalErr;

    // 2. Fetch college rankings (aggregate average points of users in each college)
    const { data: collegeRaw, error: collegeErr } = await supabaseAdmin
      .from('users')
      .select('college_name, points')
      .not('college_name', 'eq', '');

    if (collegeErr) throw collegeErr;

    // Aggregate points by college
    const collegeMap: Record<string, { totalPoints: number; userCount: number }> = {};
    collegeRaw.forEach((row) => {
      const college = row.college_name;
      if (!collegeMap[college]) {
        collegeMap[college] = { totalPoints: 0, userCount: 0 };
      }
      collegeMap[college].totalPoints += row.points || 0;
      collegeMap[college].userCount += 1;
    });

    const collegeRankings = Object.keys(collegeMap)
      .map((name) => ({
        college_name: name,
        avg_points: Math.round(collegeMap[name].totalPoints / collegeMap[name].userCount),
        user_count: collegeMap[name].userCount,
      }))
      .sort((a, b) => b.avg_points - a.avg_points)
      .slice(0, 10);

    // 3. Compute current user's global and college rank
    // Global Rank
    const { data: allUsersGlobal, error: allGError } = await supabaseAdmin
      .from('users')
      .select('id, points')
      .order('points', { ascending: false });

    if (allGError) throw allGError;

    const globalRankIndex = allUsersGlobal.findIndex((u) => u.id === userId);
    const globalRank = globalRankIndex !== -1 ? globalRankIndex + 1 : allUsersGlobal.length;

    // College Rank
    const currentUserProfile = await supabaseAdmin
      .from('users')
      .select('college_name, points')
      .eq('id', userId)
      .single();

    let collegeRank = null;
    let collegeUserCount = 0;

    if (currentUserProfile.data?.college_name) {
      const collegeName = currentUserProfile.data.college_name;
      const { data: allUsersCollege, error: allCError } = await supabaseAdmin
        .from('users')
        .select('id, points')
        .eq('college_name', collegeName)
        .order('points', { ascending: false });

      if (!allCError && allUsersCollege) {
        collegeUserCount = allUsersCollege.length;
        const colRankIdx = allUsersCollege.findIndex((u) => u.id === userId);
        collegeRank = colRankIdx !== -1 ? colRankIdx + 1 : allUsersCollege.length;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        global: globalUsers,
        colleges: collegeRankings,
        userRanking: {
          globalRank,
          totalUsersGlobal: allUsersGlobal.length,
          collegeRank,
          totalUsersCollege: collegeUserCount,
          points: currentUserProfile.data?.points || 0,
        },
      },
      message: 'Leaderboard fetched successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
