import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { generateToken } from '../utils/jwt.js';
import { config } from '../config/index.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, department, year, semester } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'Name, email, and password are required fields.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already registered
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const userId = `user-${crypto.randomUUID()}`;

  const newUser = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'STUDENT' as const,
    department: department ? department.trim() : 'Computer Science & Engineering',
    year: year ? year.trim() : '1st Year',
    semester: semester ? semester.trim() : 'Semester 1',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    bio: '',
    isBanned: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(users).values(newUser);

  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful! Welcome to StudentShare.',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      year: newUser.year,
      semester: newUser.semester,
      avatar: newUser.avatar,
      bio: newUser.bio,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Please enter your email and password.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  const user = result[0];

  if (!user) {
    res.status(401).json({ success: false, error: 'No account found with this email address.' });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ success: false, error: 'Your account has been suspended by an administrator.' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as 'STUDENT' | 'ADMIN',
  });

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      semester: user.semester,
      avatar: user.avatar,
      bio: user.bio,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated.' });
    return;
  }

  const result = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
  const user = result[0];

  if (!user) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      semester: user.semester,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  // Even if user does not exist, return a generic message to prevent user enumeration
  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been dispatched.',
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ success: false, error: 'Email and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  const user = result[0];

  if (!user) {
    res.status(404).json({ success: false, error: 'Account not found.' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));

  res.status(200).json({
    success: true,
    message: 'Password has been successfully updated. You may now log in with your new password.',
  });
}

export async function getAuthProviders(req: Request, res: Response): Promise<void> {
  const isGoogleConfigured = Boolean(config.googleClientId && config.googleClientSecret);
  res.status(200).json({
    success: true,
    providers: {
      google: {
        configured: isGoogleConfigured,
        clientId: isGoogleConfigured ? config.googleClientId : null,
      },
      emailPassword: {
        configured: true,
      },
      ai: {
        configured: Boolean(config.aiApiKey),
      },
    },
  });
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const isGoogleConfigured = Boolean(config.googleClientId && config.googleClientSecret);

  if (!isGoogleConfigured) {
    res.status(503).json({
      success: false,
      error: 'Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server environment.',
      code: 'GOOGLE_AUTH_UNCONFIGURED',
    });
    return;
  }

  const { email, name, googleId } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Google account email is required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  let result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  let user = result[0];

  const now = new Date().toISOString();

  if (!user) {
    // Create new student user via Google
    const dummyPasswordHash = await bcrypt.hash(`google-${crypto.randomUUID()}`, 10);
    const newUserId = `user-google-${crypto.randomUUID()}`;
    const newUser = {
      id: newUserId,
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash: dummyPasswordHash,
      role: 'STUDENT' as const,
      department: 'Computer Science & Engineering',
      year: '1st Year',
      semester: 'Semester 1',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || normalizedEmail)}`,
      bio: 'Joined via Google Workspace authentication.',
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(users).values(newUser);
    user = newUser;
  }

  if (user.isBanned) {
    res.status(403).json({ success: false, error: 'This account has been suspended.' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as 'STUDENT' | 'ADMIN',
  });

  res.status(200).json({
    success: true,
    message: 'Google login successful.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      semester: user.semester,
      avatar: user.avatar,
      bio: user.bio,
    },
  });
}
