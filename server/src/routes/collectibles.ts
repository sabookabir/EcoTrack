import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { localDb } from '../utils/localDb';

const router = Router();

// GET all collectibles for current user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const items = localDb.getCollectibles(userId);
    res.status(200).json({
      success: true,
      data: items,
      message: 'User eco collectibles retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
});

// GET streaks for current user
router.get('/streaks', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const streaks = localDb.getStreaks(userId);
    res.status(200).json({
      success: true,
      data: streaks,
      message: 'User eco streaks retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
