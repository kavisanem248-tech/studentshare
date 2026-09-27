import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, client } from '../db/index.js';
import {
  circles,
  circleMembers,
  circleMaterials,
  announcements,
  users,
  materials,
  notifications,
} from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Helper to verify circle membership
async function getMembership(circleId: string, userId: string) {
  const result = await db.select().from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
    .limit(1);
  return result[0] || null;
}

export async function getMyCircles(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  try {
    const result = await client.execute({
      sql: `
        SELECT c.id, c.name, c.description, c.owner_id, c.created_at, cm.role, cm.joined_at,
          (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.id) as member_count,
          (SELECT COUNT(*) FROM circle_materials WHERE circle_id = c.id) as material_count,
          (SELECT COUNT(*) FROM announcements WHERE circle_id = c.id) as announcement_count,
          u.name as owner_name, u.avatar as owner_avatar
        FROM circle_members cm
        JOIN circles c ON cm.circle_id = c.id
        JOIN users u ON c.owner_id = u.id
        WHERE cm.user_id = ?
        ORDER BY cm.joined_at DESC
      `,
      args: [req.user.id],
    });

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCircle(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const { name, password, description = '' } = req.body;

  if (!name || !password) {
    res.status(400).json({ success: false, error: 'Circle Name and Password are required.' });
    return;
  }

  if (password.length < 4) {
    res.status(400).json({ success: false, error: 'Circle password must be at least 4 characters.' });
    return;
  }

  const trimmedName = name.trim();

  try {
    const existing = await db.select().from(circles).where(eq(circles.name, trimmedName)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'A Friend Circle with this name already exists. Please choose a unique name.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const circleId = `circle-${crypto.randomUUID()}`;

    const newCircle = {
      id: circleId,
      name: trimmedName,
      description: description ? description.trim() : '',
      passwordHash,
      ownerId: req.user.id,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(circles).values(newCircle);

    // Creator becomes OWNER
    await db.insert(circleMembers).values({
      id: `cm-${crypto.randomUUID()}`,
      circleId,
      userId: req.user.id,
      role: 'OWNER',
      joinedAt: now,
    });

    res.status(201).json({
      success: true,
      message: 'Friend Circle created successfully! You are the owner.',
      data: {
        id: newCircle.id,
        name: newCircle.name,
        description: newCircle.description,
        role: 'OWNER',
        createdAt: newCircle.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function joinCircle(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const { name, password } = req.body;

  if (!name || !password) {
    res.status(400).json({ success: false, error: 'Both Circle Name and Password are required to join.' });
    return;
  }

  try {
    const result = await db.select().from(circles).where(eq(circles.name, name.trim())).limit(1);
    const circle = result[0];

    if (!circle) {
      res.status(404).json({ success: false, error: 'No Friend Circle found with that name. Please check spelling.' });
      return;
    }

    // Check if already a member
    const existingMembership = await getMembership(circle.id, req.user.id);
    if (existingMembership) {
      res.status(400).json({
        success: false,
        error: 'You are already a member of this circle.',
        circleId: circle.id,
      });
      return;
    }

    // Verify circle password
    const isPasswordValid = await bcrypt.compare(password, circle.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Incorrect circle password. Access denied.' });
      return;
    }

    const now = new Date().toISOString();
    await db.insert(circleMembers).values({
      id: `cm-${crypto.randomUUID()}`,
      circleId: circle.id,
      userId: req.user.id,
      role: 'MEMBER',
      joinedAt: now,
    });

    // Notify circle owner
    await db.insert(notifications).values({
      id: `notif-${crypto.randomUUID()}`,
      userId: circle.ownerId,
      type: 'CIRCLE_INVITE',
      title: 'New Member Joined Circle',
      message: `${req.user.name} joined your circle "${circle.name}".`,
      link: `/circles/${circle.id}`,
      isRead: false,
      createdAt: now,
    });

    res.status(200).json({
      success: true,
      message: `Successfully joined ${circle.name}!`,
      circleId: circle.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCircleDetails(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;

  try {
    // MANDATORY SECURITY CHECK: User MUST be an authenticated member of the circle (or Admin)
    const membership = await getMembership(id, req.user.id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!membership && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this private Friend Circle.',
      });
      return;
    }

    const circleResult = await client.execute({
      sql: `
        SELECT c.id, c.name, c.description, c.owner_id, c.created_at, c.updated_at,
               u.name as owner_name, u.avatar as owner_avatar, u.email as owner_email
        FROM circles c
        JOIN users u ON c.owner_id = u.id
        WHERE c.id = ?
        LIMIT 1
      `,
      args: [id],
    });

    const circle: any = circleResult.rows[0];
    if (!circle) {
      res.status(404).json({ success: false, error: 'Circle not found.' });
      return;
    }

    // Get members list
    const membersResult = await client.execute({
      sql: `
        SELECT cm.id as membership_id, cm.user_id, cm.role, cm.joined_at,
               u.name, u.email, u.avatar, u.department, u.year
        FROM circle_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.circle_id = ?
        ORDER BY CASE WHEN cm.role = 'OWNER' THEN 0 ELSE 1 END, cm.joined_at ASC
      `,
      args: [id],
    });

    // Get circle announcements
    const announcementsResult = await client.execute({
      sql: `
        SELECT a.id, a.title, a.content, a.created_at,
               u.name as author_name, u.avatar as author_avatar
        FROM announcements a
        JOIN users u ON a.author_id = u.id
        WHERE a.circle_id = ?
        ORDER BY a.created_at DESC
      `,
      args: [id],
    });

    // Get circle materials
    const materialsResult = await client.execute({
      sql: `
        SELECT m.*, cm.created_at as shared_at,
               u.name as uploader_name, u.avatar as uploader_avatar
        FROM circle_materials cm
        JOIN materials m ON cm.material_id = m.id
        JOIN users u ON m.uploader_id = u.id
        WHERE cm.circle_id = ?
        ORDER BY cm.created_at DESC
      `,
      args: [id],
    });

    res.status(200).json({
      success: true,
      data: {
        id: circle.id,
        name: circle.name,
        description: circle.description,
        ownerId: circle.owner_id,
        ownerName: circle.owner_name,
        ownerAvatar: circle.owner_avatar,
        myRole: membership ? membership.role : 'ADMIN_VIEW',
        createdAt: circle.created_at,
        members: membersResult.rows,
        announcements: announcementsResult.rows,
        materials: materialsResult.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function leaveCircle(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;

  try {
    const membership = await getMembership(id, req.user.id);
    if (!membership) {
      res.status(400).json({ success: false, error: 'You are not a member of this circle.' });
      return;
    }

    if (membership.role === 'OWNER') {
      res.status(400).json({
        success: false,
        error: 'Circle owners cannot leave their own circle. You must delete the circle or transfer ownership first.',
      });
      return;
    }

    // Immediately remove membership
    await db.delete(circleMembers)
      .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, req.user.id)));

    res.status(200).json({
      success: true,
      message: 'You have left the Friend Circle. Your access has been revoked.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteCircle(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;

  try {
    const circle = (await db.select().from(circles).where(eq(circles.id, id)).limit(1))[0];
    if (!circle) {
      res.status(404).json({ success: false, error: 'Circle not found.' });
      return;
    }

    if (circle.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only the circle owner or an administrator can delete this circle.' });
      return;
    }

    await db.delete(circles).where(eq(circles.id, id));

    res.status(200).json({
      success: true,
      message: 'Friend Circle deleted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateCirclePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    return;
  }

  try {
    const circle = (await db.select().from(circles).where(eq(circles.id, id)).limit(1))[0];
    if (!circle) {
      res.status(404).json({ success: false, error: 'Circle not found.' });
      return;
    }

    if (circle.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only the circle owner can change the password.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(circles)
      .set({ passwordHash, updatedAt: new Date().toISOString() })
      .where(eq(circles.id, id));

    res.status(200).json({
      success: true,
      message: 'Circle password updated successfully. Existing members keep their access.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function removeCircleMember(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const userId = req.params.userId as string;

  try {
    const circle = (await db.select().from(circles).where(eq(circles.id, id)).limit(1))[0];
    if (!circle) {
      res.status(404).json({ success: false, error: 'Circle not found.' });
      return;
    }

    if (circle.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only the circle owner can remove members.' });
      return;
    }

    if (userId === circle.ownerId) {
      res.status(400).json({ success: false, error: 'Circle owner cannot be removed.' });
      return;
    }

    // Delete membership immediately
    await db.delete(circleMembers)
      .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, userId)));

    // Send notification to removed user
    await db.insert(notifications).values({
      id: `notif-${crypto.randomUUID()}`,
      userId,
      type: 'CIRCLE_REMOVAL',
      title: 'Removed from Circle',
      message: `You were removed from the private circle "${circle.name}".`,
      link: '/circles',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Member has been removed and their access revoked.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function shareCircleMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const { materialId } = req.body;

  if (!materialId) {
    res.status(400).json({ success: false, error: 'Material ID is required.' });
    return;
  }

  try {
    // Check membership
    const membership = await getMembership(id, req.user.id);
    if (!membership && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only circle members can share study materials inside this circle.' });
      return;
    }

    const material = (await db.select().from(materials).where(eq(materials.id, materialId)).limit(1))[0];
    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found.' });
      return;
    }

    const existing = await db.select().from(circleMaterials)
      .where(and(eq(circleMaterials.circleId, id), eq(circleMaterials.materialId, materialId)))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'This material is already shared in the circle.' });
      return;
    }

    await db.insert(circleMaterials).values({
      id: `cm-mat-${crypto.randomUUID()}`,
      circleId: id,
      materialId,
      sharedBy: req.user.id,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Material shared into the circle successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function removeCircleMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const materialId = req.params.materialId as string;

  try {
    const circle = (await db.select().from(circles).where(eq(circles.id, id)).limit(1))[0];
    if (!circle) {
      res.status(404).json({ success: false, error: 'Circle not found.' });
      return;
    }

    const record = (await db.select().from(circleMaterials)
      .where(and(eq(circleMaterials.circleId, id), eq(circleMaterials.materialId, materialId)))
      .limit(1))[0];

    if (!record) {
      res.status(404).json({ success: false, error: 'Material not linked to this circle.' });
      return;
    }

    // Owner or original sharer can remove
    if (circle.ownerId !== req.user.id && record.sharedBy !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only the circle owner or the member who shared this material can remove it.' });
      return;
    }

    await db.delete(circleMaterials)
      .where(and(eq(circleMaterials.circleId, id), eq(circleMaterials.materialId, materialId)));

    res.status(200).json({
      success: true,
      message: 'Material unlinked from circle.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400).json({ success: false, error: 'Announcement title and content are required.' });
    return;
  }

  try {
    const membership = await getMembership(id, req.user.id);
    if (!membership && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only circle members can post announcements.' });
      return;
    }

    const now = new Date().toISOString();
    const annId = `ann-${crypto.randomUUID()}`;

    await db.insert(announcements).values({
      id: annId,
      circleId: id,
      authorId: req.user.id,
      title: title.trim(),
      content: content.trim(),
      createdAt: now,
    });

    // Notify other circle members
    const members = await db.select({ userId: circleMembers.userId })
      .from(circleMembers)
      .where(eq(circleMembers.circleId, id));

    for (const member of members) {
      if (member.userId !== req.user.id) {
        await db.insert(notifications).values({
          id: `notif-${crypto.randomUUID()}`,
          userId: member.userId,
          type: 'CIRCLE_ANNOUNCEMENT',
          title: `New Announcement in Circle`,
          message: `${title.trim()}`,
          link: `/circles/${id}`,
          isRead: false,
          createdAt: now,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement posted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteAnnouncement(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const announcementId = req.params.announcementId as string;

  try {
    const circle = (await db.select().from(circles).where(eq(circles.id, id)).limit(1))[0];
    const ann = (await db.select().from(announcements).where(eq(announcements.id, announcementId)).limit(1))[0];

    if (!circle || !ann) {
      res.status(404).json({ success: false, error: 'Announcement not found.' });
      return;
    }

    if (circle.ownerId !== req.user.id && ann.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only the author or circle owner can delete this announcement.' });
      return;
    }

    await db.delete(announcements).where(eq(announcements.id, announcementId));

    res.status(200).json({
      success: true,
      message: 'Announcement deleted.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
