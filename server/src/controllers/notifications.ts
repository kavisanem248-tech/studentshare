import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  try {
    const list = await db.select().from(notifications)
      .where(eq(notifications.userId, req.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = list.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: list,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;

  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.user.id)));

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, req.user.id));

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
