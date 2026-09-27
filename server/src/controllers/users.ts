import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, client } from '../db/index.js';
import { users, materials, savedMaterials, downloads } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function getSavedMaterials(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  try {
    const result = await client.execute({
      sql: `
        SELECT m.*, sm.created_at as saved_at, u.name as uploader_name, u.avatar as uploader_avatar
        FROM saved_materials sm
        JOIN materials m ON sm.material_id = m.id
        JOIN users u ON m.uploader_id = u.id
        WHERE sm.user_id = ?
        ORDER BY sm.created_at DESC
      `,
      args: [req.user.id],
    });

    const items = result.rows.map((row: any) => ({
      ...row,
      tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      isSaved: true,
    }));

    res.status(200).json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDownloadHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  try {
    const result = await client.execute({
      sql: `
        SELECT d.id as download_id, d.downloaded_at, m.id as material_id, m.title, m.subject,
               m.file_name, m.file_size, m.file_type, u.name as uploader_name
        FROM downloads d
        JOIN materials m ON d.material_id = m.id
        JOIN users u ON m.uploader_id = u.id
        WHERE d.user_id = ?
        ORDER BY d.downloaded_at DESC
      `,
      args: [req.user.id],
    });

    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMyUploads(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  try {
    const result = await client.execute({
      sql: `
        SELECT m.*
        FROM materials m
        WHERE m.uploader_id = ?
        ORDER BY m.created_at DESC
      `,
      args: [req.user.id],
    });

    const items = result.rows.map((row: any) => ({
      ...row,
      tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    }));

    res.status(200).json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const { name, department, year, semester, bio, avatar } = req.body;

  try {
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (name) updateData.name = name.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (year !== undefined) updateData.year = year.trim();
    if (semester !== undefined) updateData.semester = semester.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (avatar !== undefined) updateData.avatar = avatar.trim();

    await db.update(users).set(updateData).where(eq(users.id, req.user.id));

    const updatedUser = (await db.select().from(users).where(eq(users.id, req.user.id)).limit(1))[0];

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        year: updatedUser.year,
        semester: updatedUser.semester,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400).json({ success: false, error: 'Both current password and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    return;
  }

  try {
    const user = (await db.select().from(users).where(eq(users.id, req.user.id)).limit(1))[0];
    if (!user) {
      res.status(404).json({ success: false, error: 'User record not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, error: 'Current password does not match.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ passwordHash: newHash, updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
