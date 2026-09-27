import { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { db, client } from '../db/index.js';
import { materials, users, savedMaterials, downloads, ratings, reports, notifications } from '../db/schema.js';
import { eq, and, sql, desc, asc, like, or } from 'drizzle-orm';
import { saveFile, getFileStream, deleteFile } from '../utils/storage.js';
import { generatePdfSummary, askQuestionAboutMaterial } from '../utils/ai.js';

export async function getMaterials(req: Request, res: Response): Promise<void> {
  try {
    const {
      department,
      year,
      semester,
      unit,
      materialType,
      subject,
      uploaderId,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let queryStr = `
      SELECT m.*, u.name as uploader_name, u.avatar as uploader_avatar, u.department as uploader_dept
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      WHERE m.is_approved = 1
    `;
    const params: any[] = [];

    if (department && department !== 'All') {
      queryStr += ` AND m.department = ?`;
      params.push(department);
    }
    if (year && year !== 'All') {
      queryStr += ` AND m.year = ?`;
      params.push(year);
    }
    if (semester && semester !== 'All') {
      queryStr += ` AND m.semester = ?`;
      params.push(semester);
    }
    if (unit && unit !== 'All') {
      queryStr += ` AND m.unit = ?`;
      params.push(unit);
    }
    if (materialType && materialType !== 'All') {
      queryStr += ` AND m.material_type = ?`;
      params.push(materialType);
    }
    if (subject && subject !== 'All') {
      queryStr += ` AND m.subject = ?`;
      params.push(subject);
    }
    if (uploaderId) {
      queryStr += ` AND m.uploader_id = ?`;
      params.push(uploaderId);
    }

    // Sort order
    if (sort === 'most_downloaded') {
      queryStr += ` ORDER BY m.download_count DESC, m.created_at DESC`;
    } else if (sort === 'highest_rated') {
      queryStr += ` ORDER BY m.average_rating DESC, m.rating_count DESC`;
    } else {
      queryStr += ` ORDER BY m.created_at DESC`;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM (${queryStr})`;
    const countResult = await client.execute({ sql: countQuery, args: params });
    const total = Number(countResult.rows[0]?.total || 0);

    queryStr += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const result = await client.execute({ sql: queryStr, args: params });

    // Check saved state for current user
    let userSavedIds = new Set<string>();
    if (req.user) {
      const saved = await db.select({ materialId: savedMaterials.materialId })
        .from(savedMaterials)
        .where(eq(savedMaterials.userId, req.user.id));
      userSavedIds = new Set(saved.map((s) => s.materialId));
    }

    const items = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      topic: row.topic,
      description: row.description,
      tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      department: row.department,
      year: row.year,
      semester: row.semester,
      unit: row.unit,
      materialType: row.material_type,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileType: row.file_type,
      uploaderId: row.uploader_id,
      uploaderName: row.uploader_name,
      uploaderAvatar: row.uploader_avatar,
      uploaderDept: row.uploader_dept,
      downloadCount: row.download_count,
      viewCount: row.view_count,
      averageRating: row.average_rating,
      ratingCount: row.rating_count,
      createdAt: row.created_at,
      isSaved: userSavedIds.has(row.id),
    }));

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function searchMaterials(req: Request, res: Response): Promise<void> {
  try {
    const {
      q = '',
      department,
      year,
      semester,
      unit,
      materialType,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const searchTerm = `%${(q as string).trim()}%`;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let queryStr = `
      SELECT m.*, u.name as uploader_name, u.avatar as uploader_avatar, u.department as uploader_dept
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      WHERE m.is_approved = 1
      AND (
        m.title LIKE ? OR
        m.subject LIKE ? OR
        m.topic LIKE ? OR
        m.description LIKE ? OR
        m.tags LIKE ?
      )
    `;
    const params: any[] = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (department && department !== 'All') {
      queryStr += ` AND m.department = ?`;
      params.push(department);
    }
    if (year && year !== 'All') {
      queryStr += ` AND m.year = ?`;
      params.push(year);
    }
    if (semester && semester !== 'All') {
      queryStr += ` AND m.semester = ?`;
      params.push(semester);
    }
    if (unit && unit !== 'All') {
      queryStr += ` AND m.unit = ?`;
      params.push(unit);
    }
    if (materialType && materialType !== 'All') {
      queryStr += ` AND m.material_type = ?`;
      params.push(materialType);
    }

    if (sort === 'most_downloaded') {
      queryStr += ` ORDER BY m.download_count DESC, m.created_at DESC`;
    } else if (sort === 'highest_rated') {
      queryStr += ` ORDER BY m.average_rating DESC, m.rating_count DESC`;
    } else {
      queryStr += ` ORDER BY m.created_at DESC`;
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${queryStr})`;
    const countResult = await client.execute({ sql: countQuery, args: params });
    const total = Number(countResult.rows[0]?.total || 0);

    queryStr += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const result = await client.execute({ sql: queryStr, args: params });

    let userSavedIds = new Set<string>();
    if (req.user) {
      const saved = await db.select({ materialId: savedMaterials.materialId })
        .from(savedMaterials)
        .where(eq(savedMaterials.userId, req.user.id));
      userSavedIds = new Set(saved.map((s) => s.materialId));
    }

    const items = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      topic: row.topic,
      description: row.description,
      tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      department: row.department,
      year: row.year,
      semester: row.semester,
      unit: row.unit,
      materialType: row.material_type,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileType: row.file_type,
      uploaderId: row.uploader_id,
      uploaderName: row.uploader_name,
      uploaderAvatar: row.uploader_avatar,
      uploaderDept: row.uploader_dept,
      downloadCount: row.download_count,
      viewCount: row.view_count,
      averageRating: row.average_rating,
      ratingCount: row.rating_count,
      createdAt: row.created_at,
      isSaved: userSavedIds.has(row.id),
    }));

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMaterialById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const result = await client.execute({
      sql: `
        SELECT m.*, u.name as uploader_name, u.email as uploader_email, u.avatar as uploader_avatar, u.department as uploader_dept
        FROM materials m
        JOIN users u ON m.uploader_id = u.id
        WHERE m.id = ?
        LIMIT 1
      `,
      args: [id],
    });

    const row: any = result.rows[0];
    if (!row) {
      res.status(404).json({ success: false, error: 'Study material not found.' });
      return;
    }

    // Check private circle material authorization
    if (!row.is_approved) {
      const isOwnerOrAdmin = req.user && (req.user.id === row.uploader_id || req.user.role === 'ADMIN');
      let hasCircleAccess = isOwnerOrAdmin;

      if (!hasCircleAccess && req.user) {
        const circleAccess = await client.execute({
          sql: `
            SELECT 1 
            FROM circle_materials cm
            JOIN circle_members cmem ON cm.circle_id = cmem.circle_id
            WHERE cm.material_id = ? AND cmem.user_id = ?
            LIMIT 1
          `,
          args: [id, req.user.id],
        });
        hasCircleAccess = circleAccess.rows.length > 0;
      }

      if (!hasCircleAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You must be a member of this private circle to access this material.',
        });
        return;
      }
    }

    // Increment view count asynchronously
    await client.execute({
      sql: `UPDATE materials SET view_count = view_count + 1 WHERE id = ?`,
      args: [id],
    });

    let isSaved = false;
    let userRating: number | null = null;

    if (req.user) {
      const saved = await db.select().from(savedMaterials)
        .where(and(eq(savedMaterials.userId, req.user.id), eq(savedMaterials.materialId, id)))
        .limit(1);
      isSaved = saved.length > 0;

      const userRate = await db.select().from(ratings)
        .where(and(eq(ratings.userId, req.user.id), eq(ratings.materialId, id)))
        .limit(1);
      if (userRate.length > 0) {
        userRating = userRate[0].rating;
      }
    }

    // Get recent ratings/reviews
    const reviewsResult = await client.execute({
      sql: `
        SELECT r.id, r.rating, r.review, r.created_at, u.name as user_name, u.avatar as user_avatar
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.material_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `,
      args: [id],
    });

    res.status(200).json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        subject: row.subject,
        topic: row.topic,
        description: row.description,
        tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        department: row.department,
        year: row.year,
        semester: row.semester,
        unit: row.unit,
        materialType: row.material_type,
        fileName: row.file_name,
        fileSize: row.file_size,
        fileType: row.file_type,
        uploaderId: row.uploader_id,
        uploaderName: row.uploader_name,
        uploaderEmail: row.uploader_email,
        uploaderAvatar: row.uploader_avatar,
        uploaderDept: row.uploader_dept,
        downloadCount: row.download_count,
        viewCount: row.view_count + 1,
        averageRating: row.average_rating,
        ratingCount: row.rating_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isSaved,
        userRating,
        reviews: reviewsResult.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required to upload materials.' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'Please choose a document file to upload (PDF, DOCX, PPTX, TXT).' });
    return;
  }

  const {
    title,
    subject,
    topic,
    description = '',
    tags = '',
    department,
    year,
    semester,
    unit,
    materialType,
  } = req.body;

  if (!title || !subject || !topic || !department || !year || !semester || !unit || !materialType) {
    res.status(400).json({
      success: false,
      error: 'Please fill in all mandatory academic metadata fields (title, subject, topic, department, year, semester, unit, material type).',
    });
    return;
  }

  try {
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { filePath } = await saveFile(file.buffer, uniqueFileName, file.mimetype);

    const now = new Date().toISOString();
    const materialId = `mat-${crypto.randomUUID()}`;

    const newMaterial = {
      id: materialId,
      title: title.trim(),
      subject: subject.trim(),
      topic: topic.trim(),
      description: description.trim(),
      tags: typeof tags === 'string' ? tags.trim() : '',
      department: department.trim(),
      year: year.trim(),
      semester: semester.trim(),
      unit: unit.trim(),
      materialType: materialType.trim(),
      filePath,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: ext,
      uploaderId: req.user.id,
      downloadCount: 0,
      viewCount: 0,
      averageRating: 0.0,
      ratingCount: 0,
      isApproved: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(materials).values(newMaterial);

    // Send confirmation notification
    await db.insert(notifications).values({
      id: `notif-${crypto.randomUUID()}`,
      userId: req.user.id,
      type: 'MATERIAL_UPLOAD',
      title: 'Material Published',
      message: `Your material "${title.trim()}" has been published and is now available to peer students.`,
      link: `/materials/${materialId}`,
      isRead: false,
      createdAt: now,
    });

    res.status(201).json({
      success: true,
      message: 'Material uploaded and shared successfully.',
      data: newMaterial,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const existing = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  const material = existing[0];

  if (!material) {
    res.status(404).json({ success: false, error: 'Material not found.' });
    return;
  }

  // Ownership or Admin check
  if (material.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Access denied. You can only edit materials you uploaded.' });
    return;
  }

  const { title, subject, topic, description, tags, department, year, semester, unit, materialType } = req.body;

  try {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (title) updateData.title = title.trim();
    if (subject) updateData.subject = subject.trim();
    if (topic) updateData.topic = topic.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (department) updateData.department = department.trim();
    if (year) updateData.year = year.trim();
    if (semester) updateData.semester = semester.trim();
    if (unit) updateData.unit = unit.trim();
    if (materialType) updateData.materialType = materialType.trim();

    await db.update(materials).set(updateData).where(eq(materials.id, id));

    res.status(200).json({
      success: true,
      message: 'Study material updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;
  const existing = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  const material = existing[0];

  if (!material) {
    res.status(404).json({ success: false, error: 'Material not found.' });
    return;
  }

  // Ownership check
  if (material.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Access denied. You can only delete materials you uploaded.' });
    return;
  }

  try {
    // Delete physical file
    await deleteFile(material.filePath);
    // Delete database record (cascading deletes will clean saved, downloads, ratings, circle materials)
    await db.delete(materials).where(eq(materials.id, id));

    res.status(200).json({
      success: true,
      message: 'Study material removed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function downloadMaterial(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const existing = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
    const material = existing[0];

    if (!material) {
      res.status(404).json({ success: false, error: 'Study material not found.' });
      return;
    }

    // Check private circle material authorization
    if (!material.isApproved) {
      const isOwnerOrAdmin = req.user && (req.user.id === material.uploaderId || req.user.role === 'ADMIN');
      let hasCircleAccess = isOwnerOrAdmin;

      if (!hasCircleAccess && req.user) {
        const circleAccess = await client.execute({
          sql: `
            SELECT 1 
            FROM circle_materials cm
            JOIN circle_members cmem ON cm.circle_id = cmem.circle_id
            WHERE cm.material_id = ? AND cmem.user_id = ?
            LIMIT 1
          `,
          args: [id, req.user.id],
        });
        hasCircleAccess = circleAccess.rows.length > 0;
      }

      if (!hasCircleAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You must be a member of this private circle to download this material.',
        });
        return;
      }
    }

    // Increment download count
    await client.execute({
      sql: `UPDATE materials SET download_count = download_count + 1 WHERE id = ?`,
      args: [id],
    });

    // Record download history if authenticated
    if (req.user) {
      await db.insert(downloads).values({
        id: `dl-${crypto.randomUUID()}`,
        userId: req.user.id,
        materialId: material.id,
        downloadedAt: new Date().toISOString(),
      });
    }

    const fileResult = await getFileStream(material.filePath);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(material.fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    if (fileResult.isLocal && fileResult.localPath) {
      res.sendFile(fileResult.localPath);
    } else if (fileResult.stream) {
      fileResult.stream.pipe(res);
    } else {
      res.status(404).json({ success: false, error: 'Underlying document file is missing.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function previewMaterial(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const existing = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
    const material = existing[0];

    if (!material) {
      res.status(404).json({ success: false, error: 'Study material not found.' });
      return;
    }

    // Check private circle material authorization
    if (!material.isApproved) {
      const isOwnerOrAdmin = req.user && (req.user.id === material.uploaderId || req.user.role === 'ADMIN');
      let hasCircleAccess = isOwnerOrAdmin;

      if (!hasCircleAccess && req.user) {
        const circleAccess = await client.execute({
          sql: `
            SELECT 1 
            FROM circle_materials cm
            JOIN circle_members cmem ON cm.circle_id = cmem.circle_id
            WHERE cm.material_id = ? AND cmem.user_id = ?
            LIMIT 1
          `,
          args: [id, req.user.id],
        });
        hasCircleAccess = circleAccess.rows.length > 0;
      }

      if (!hasCircleAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You must be a member of this private circle to preview this material.',
        });
        return;
      }
    }

    const fileResult = await getFileStream(material.filePath);

    let mimeType = 'application/pdf';
    if (material.fileType === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (material.fileType === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (material.fileType === 'png') mimeType = 'image/png';
    else if (material.fileType === 'jpg' || material.fileType === 'jpeg') mimeType = 'image/jpeg';
    else if (material.fileType === 'txt') mimeType = 'text/plain';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(material.fileName)}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (fileResult.isLocal && fileResult.localPath) {
      res.sendFile(fileResult.localPath);
    } else if (fileResult.stream) {
      fileResult.stream.pipe(res);
    } else {
      res.status(404).json({ success: false, error: 'Document file missing.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function saveMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required to save study materials.' });
    return;
  }

  const id = req.params.id as string;

  try {
    const existing = await db.select().from(savedMaterials)
      .where(and(eq(savedMaterials.userId, req.user.id), eq(savedMaterials.materialId, id)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(savedMaterials).values({
        id: `save-${crypto.randomUUID()}`,
        userId: req.user.id,
        materialId: id,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(200).json({ success: true, message: 'Material added to your saved bookmarks.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function unsaveMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const id = req.params.id as string;

  try {
    await db.delete(savedMaterials)
      .where(and(eq(savedMaterials.userId, req.user.id), eq(savedMaterials.materialId, id)));

    res.status(200).json({ success: true, message: 'Material removed from saved bookmarks.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function rateMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required to rate materials.' });
    return;
  }

  const id = req.params.id as string;
  const { rating, review = '' } = req.body;

  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5 stars.' });
    return;
  }

  try {
    const now = new Date().toISOString();
    const existing = await db.select().from(ratings)
      .where(and(eq(ratings.userId, req.user.id), eq(ratings.materialId, id)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(ratings)
        .set({ rating: numericRating, review: review ? review.trim() : null, updatedAt: now })
        .where(eq(ratings.id, existing[0].id));
    } else {
      await db.insert(ratings).values({
        id: `rate-${crypto.randomUUID()}`,
        userId: req.user.id,
        materialId: id,
        rating: numericRating,
        review: review ? review.trim() : null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Recalculate average rating and rating count
    const stats = await client.execute({
      sql: `SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE material_id = ?`,
      args: [id],
    });

    const avgRating = Number(stats.rows[0]?.avg_rating || 0);
    const count = Number(stats.rows[0]?.count || 0);

    await client.execute({
      sql: `UPDATE materials SET average_rating = ?, rating_count = ? WHERE id = ?`,
      args: [parseFloat(avgRating.toFixed(1)), count, id],
    });

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully.',
      averageRating: parseFloat(avgRating.toFixed(1)),
      ratingCount: count,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function reportMaterial(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required to report materials.' });
    return;
  }

  const id = req.params.id as string;
  const { reason, details = '' } = req.body;

  if (!reason) {
    res.status(400).json({ success: false, error: 'Please specify the reason for the report.' });
    return;
  }

  const validReasons = ['Incorrect content', 'Duplicate', 'Inappropriate', 'Copyright concern', 'Spam', 'Other'];
  if (!validReasons.includes(reason)) {
    res.status(400).json({ success: false, error: `Invalid report reason. Choose from: ${validReasons.join(', ')}` });
    return;
  }

  try {
    const now = new Date().toISOString();
    await db.insert(reports).values({
      id: `rep-${crypto.randomUUID()}`,
      userId: req.user.id,
      materialId: id,
      reason,
      details: details ? details.trim() : null,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({
      success: true,
      message: 'Your report has been submitted to the academic administrators for review.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAiSummary(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const existing = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
    const material = existing[0];
    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found.' });
      return;
    }

    const result = await generatePdfSummary(material.title, material.description || material.subject);
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function askAiQuestion(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { question } = req.body;

  if (!question) {
    res.status(400).json({ success: false, error: 'Please enter a question to ask.' });
    return;
  }

  try {
    const existing = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
    const material = existing[0];
    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found.' });
      return;
    }

    const result = await askQuestionAboutMaterial(material.title, question);
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
