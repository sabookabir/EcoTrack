import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

const router = Router();

// GET global admin statistics
router.get('/stats', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    // 1. Total Users
    const { count: totalUsers, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersErr) throw usersErr;

    // 2. Total tracked emissions (sum of total_co2_kg)
    const { data: sumData, error: sumErr } = await supabaseAdmin
      .from('carbon_entries')
      .select('total_co2_kg');

    if (sumErr) throw sumErr;

    const totalCO2Tracked = sumData.reduce((acc, curr) => acc + Number(curr.total_co2_kg || 0), 0);

    // 3. Active users (users who logged at least 1 entry in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: activeUsersData, error: activeErr } = await supabaseAdmin
      .from('carbon_entries')
      .select('user_id')
      .gte('entry_date', sevenDaysAgoStr);

    if (activeErr) throw activeErr;
    const activeUsersCount = new Set(activeUsersData.map(e => e.user_id)).size;

    // 4. Challenge participation (joined vs completed)
    const { data: participationData, error: partErr } = await supabaseAdmin
      .from('user_challenges')
      .select('status');

    if (partErr) throw partErr;

    const totalJoined = participationData.length;
    const totalCompleted = participationData.filter(p => p.status === 'completed').length;

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalCO2Tracked: Math.round(totalCO2Tracked * 100) / 100,
        activeUsers: activeUsersCount,
        challenges: {
          totalJoined,
          totalCompleted,
          completionRate: totalJoined > 0 ? Math.round((totalCompleted / totalJoined) * 100) : 0,
        }
      },
      message: 'Admin statistics retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
});

// GET list of all users
router.get('/users', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: users,
      message: 'All users list fetched successfully',
    });
  } catch (err) {
    next(err);
  }
});

// GET audit logs
router.get('/audit-logs', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select(`
        id,
        action,
        details,
        ip_address,
        created_at,
        users (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: logs,
      message: 'Audit logs retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
});

// POST create a challenge
router.post('/challenges', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { title, description, points, duration_days, category } = req.body;

    if (!title || !description || !points || !duration_days || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required challenge parameters',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('challenges')
      .insert({
        title,
        description,
        points: Number(points),
        duration_days: Number(duration_days),
        category,
      })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: req.user!.id,
      action: 'admin_create_challenge',
      details: { title, points }
    });

    res.status(201).json({
      success: true,
      data,
      message: `Eco Challenge '${title}' created successfully!`,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE a challenge
router.delete('/challenges/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const challengeId = req.params.id;

    const { data: check, error: checkErr } = await supabaseAdmin
      .from('challenges')
      .select('title')
      .eq('id', challengeId)
      .single();

    if (checkErr || !check) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    const { error } = await supabaseAdmin
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (error) throw error;

    // Log action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: req.user!.id,
      action: 'admin_delete_challenge',
      details: { id: challengeId, title: check.title }
    });

    res.status(200).json({
      success: true,
      data: { id: challengeId },
      message: `Eco Challenge '${check.title}' deleted successfully!`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
