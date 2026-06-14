import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Validate the token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn('JWT authentication failed via Supabase');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired token',
      });
    }

    // Retrieve their role from the public.users database table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error(`Error querying user profile role: ${profileError.message}`);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user',
    };

    next();
  } catch (error) {
    logger.error(`Error in authentication middleware: ${(error as Error).message}`);
    next(error);
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by user: ${req.user?.id}`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
    });
  }
  next();
};
