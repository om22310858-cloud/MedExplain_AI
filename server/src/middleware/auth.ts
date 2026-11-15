import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';
import { sendError } from '../utils/response.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers.cookie) {
      // Check cookies for 'token='
      const cookieMatch = req.headers.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('token='));
      if (cookieMatch) {
        token = cookieMatch.split('=')[1];
      }
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401);
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      sendError(res, 'Invalid or expired session. Please log in again.', 401);
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      sendError(res, 'User account not found', 401);
      return;
    }

    if (user.accountStatus !== 'active') {
      sendError(res, 'Account is suspended or inactive. Please contact support.', 403);
      return;
    }

    req.user = user as IUser;
    next();
  } catch (error) {
    sendError(res, 'Authentication failed. Please log in again.', 401);
  }
};
