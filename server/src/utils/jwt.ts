import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.authSecret, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.authSecret) as TokenPayload;
}
