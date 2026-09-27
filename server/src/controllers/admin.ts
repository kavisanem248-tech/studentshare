import { Request, Response } from 'express';
import crypto from 'crypto';
import { db, client } from '../db/index.js';
import { users, materials, reports, circles, categories, downloads } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { deleteFile } from '../utils/storage.js';

export async function getStatistics(req: Request, res: Response): Promise<void> {
  try {
    const userCount = await client.execute('SELECT COUNT(*) as count FROM users');
    const materialCount = await client.execute('SELECT COUNT(*) as count FROM materials');
    const downloadCount = await client.execute('SELECT COUNT(*) as count FROM downloads');
    const circleCount = await client.execute('SELECT COUNT(*) as count FROM circles');
    const reportCount = await client.execute("SELECT COUNT(*) as count FROM reports WHERE status = 'PENDING'");
    const totalDownloadsSum = await client.execute('SELECT SUM(download_count) as total FROM materials');

    // Recent 5 uploads
    const recentMaterials = await client.execute(`
      SELECT m.id, m.title, m.subject, m.department, m.created_at, u.name as uploader_name
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `);

    // Recent 5 users
    const recentUsers = await client.execute(`
      SELECT id, name, email, role, department, created_at, is_banned
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: Number(userCount.rows[0]?.count || 0),
        totalMaterials: Number(materialCount.rows[0]?.count || 0),
        totalDownloads: Number(totalDownloadsSum.rows[0]?.total || downloadCount.rows[0]?.count || 0),
        totalCircles: Number(circleCount.rows[0]?.count || 0),
        pendingReports: Number(reportCount.rows[0]?.count || 0),
        recentMaterials: recentMaterials.rows,
        recentUsers: recentUsers.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const result = await client.execute(`
      SELECT id, name, email, role, department, year, semester, avatar, is_banned, created_at,
        (SELECT COUNT(*) FROM materials WHERE uploader_id = users.id) as upload_count
      FROM users
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function toggleUserBan(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { isBanned } = req.body;

  try {
    const user = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    if (user.id === req.user?.id) {
      res.status(400).json({ success: false, error: 'Administrators cannot ban their own account.' });
      return;
    }

    await db.update(users)
      .set({ isBanned: Boolean(isBanned), updatedAt: new Date().toISOString() })
      .where(eq(users.id, id));

    res.status(200).json({
      success: true,
      message: `User account has been ${isBanned ? 'suspended' : 're-activated'}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { role } = req.body;

  if (role !== 'STUDENT' && role !== 'ADMIN') {
    res.status(400).json({ success: false, error: 'Role must be STUDENT or ADMIN.' });
    return;
  }

  try {
    await db.update(users)
      .set({ role, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id));

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAdminMaterials(req: Request, res: Response): Promise<void> {
  try {
    const result = await client.execute(`
      SELECT m.*, u.name as uploader_name, u.email as uploader_email
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      ORDER BY m.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function toggleMaterialApproval(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { isApproved } = req.body;

  try {
    await db.update(materials)
      .set({ isApproved: Boolean(isApproved), updatedAt: new Date().toISOString() })
      .where(eq(materials.id, id));

    res.status(200).json({
      success: true,
      message: `Material visibility updated: ${isApproved ? 'Approved' : 'Unapproved'}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteAdminMaterial(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const material = (await db.select().from(materials).where(eq(materials.id, id)).limit(1))[0];
    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found.' });
      return;
    }

    await deleteFile(material.filePath);
    await db.delete(materials).where(eq(materials.id, id));

    res.status(200).json({
      success: true,
      message: 'Material permanently deleted by administrator.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAdminReports(req: Request, res: Response): Promise<void> {
  try {
    const result = await client.execute(`
      SELECT r.*, m.title as material_title, m.subject as material_subject,
             u.name as reporter_name, u.email as reporter_email,
             up.name as uploader_name
      FROM reports r
      JOIN materials m ON r.material_id = m.id
      JOIN users u ON r.user_id = u.id
      JOIN users up ON m.uploader_id = up.id
      ORDER BY CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END, r.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateReportStatus(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status. Choose from: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    await db.update(reports)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(reports.id, id));

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAdminCircles(req: Request, res: Response): Promise<void> {
  try {
    const result = await client.execute(`
      SELECT c.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.id) as member_count,
        (SELECT COUNT(*) FROM circle_materials WHERE circle_id = c.id) as material_count
      FROM circles c
      JOIN users u ON c.owner_id = u.id
      ORDER BY c.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteAdminCircle(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    await db.delete(circles).where(eq(circles.id, id));
    res.status(200).json({ success: true, message: 'Friend Circle deleted by administrator.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const list = await db.select().from(categories);
    res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, code, description = '', icon = 'BookOpen' } = req.body;

  if (!name || !code) {
    res.status(400).json({ success: false, error: 'Category Name and Code are required.' });
    return;
  }

  try {
    const newCat = {
      id: `cat-${crypto.randomUUID()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      icon: icon ? icon.trim() : 'BookOpen',
    };
    await db.insert(categories).values(newCat);
    res.status(201).json({ success: true, message: 'Category created.', data: newCat });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    await db.delete(categories).where(eq(categories.id, id));
    res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
