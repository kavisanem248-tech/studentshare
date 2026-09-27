import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Extend Express Request to include user
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  department: string | null;
  year: string | null;
  avatar: string | null;
  isBanned: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required. No Bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    const result = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    const user = result[0];

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid authentication session. User no longer exists.' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ success: false, error: 'Your account has been suspended by the academic administrator.' });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'STUDENT' | 'ADMIN',
      department: user.department,
      year: user.year,
      avatar: user.avatar,
      isBanned: user.isBanned,
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Authentication token is expired or invalid.' });
    return;
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      const result = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      const user = result[0];
      if (user && !user.isBanned) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as 'STUDENT' | 'ADMIN',
          department: user.department,
          year: user.year,
          avatar: user.avatar,
          isBanned: user.isBanned,
        };
      }
    } catch {
      // ignore
    }
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Access denied. Administrator privileges required.' });
    return;
  }

  next();
}
