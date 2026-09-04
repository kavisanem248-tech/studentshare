import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { users } from "../drizzle/schema";
import { getDb, getUserByEmail } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashSessionToken, sdk } from "./_core/sdk";
import { revokeSessionByTokenHash } from "./db";

const credentialsSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(8).max(128) });
const signupSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(120), confirmPassword: z.string().min(8).max(128) });

function safeUser(user: any) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

async function issueSession(userId: number, req: Request, res: Response) {
  const token = await sdk.createSessionToken(userId, { expiresInMs: ONE_YEAR_MS });
  res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
  return token;
}

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const input = signupSchema.parse(req.body);
      if (input.password !== input.confirmPassword) {
        res.status(400).json({ error: "Passwords do not match." });
        return;
      }
      const email = input.email.toLowerCase();
      const existing = await getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable." });
        return;
      }
      const passwordHash = await bcrypt.hash(input.password, 12);
      const result = await db.insert(users).values({ openId: `local_${randomUUID()}`, name: input.name, email, passwordHash, loginMethod: "email" });
      const user = await getUserByEmail(email);
      if (!user) {
        res.status(500).json({ error: "Account was created but could not be loaded." });
        return;
      }
      await issueSession(Number(result[0].insertId), req, res);
      res.status(201).json({ user: safeUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.issues[0]?.message || "Please check your details." });
        return;
      }
      console.error("[Auth] Signup failed", error);
      res.status(500).json({ error: "Signup failed. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = credentialsSchema.parse(req.body);
      const user = await getUserByEmail(input.email);
      if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
        res.status(401).json({ error: "Email or password is incorrect." });
        return;
      }
      await issueSession(user.id, req, res);
      res.json({ user: safeUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.issues[0]?.message || "Please check your details." });
        return;
      }
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const token = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
      if (token) await revokeSessionByTokenHash(hashSessionToken(token));
      res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Logout failed", error);
      res.status(500).json({ error: "Logout failed. Please try again." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: safeUser(user) });
    } catch {
      res.status(401).json({ user: null });
    }
  });
}
