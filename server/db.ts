import { and, asc, count, desc, eq, inArray, isNull, like, or, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  downloads,
  groupMembers,
  groups,
  pdfFiles,
  reports,
  sessions,
  subjects,
  users,
  views,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "passwordHash", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      const normalized = field === "email" && user[field] ? user[field].trim().toLowerCase() : user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  return result[0];
}

export async function createSession(input: { tokenHash: string; userId: number; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(sessions).values(input);
}

export async function getSessionByTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);
  const session = result[0];
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return undefined;
  return session;
}

export async function revokeSessionByTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, tokenHash));
}

export async function listSubjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects).orderBy(asc(subjects.name));
}

export async function createSubject(input: {
  name: string;
  code?: string;
  department?: string;
  semester?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.name, input.name), input.code ? eq(subjects.code, input.code) : sql`${subjects.code} IS NULL`))
    .limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(subjects).values({ ...input, code: input.code || null, department: input.department || null, semester: input.semester || null });
  const id = Number(result[0].insertId);
  const created = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  return created[0];
}

export async function createGroup(input: { groupId: string; name: string; passwordHash: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(groups).values(input);
  const id = Number(result[0].insertId);
  await db.insert(groupMembers).values({ groupId: id, userId: input.createdBy, role: "owner" });
  const created = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return created[0];
}

export async function getGroupByCode(groupId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(groups).where(eq(groups.groupId, groupId)).limit(1);
  return result[0];
}

export async function getGroupById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return result[0];
}

export async function addGroupMember(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(groupMembers).values({ groupId, userId, role: "member" }).onDuplicateKeyUpdate({ set: { joinedAt: new Date() } });
  return db.select({ group: groups, role: groupMembers.role, joinedAt: groupMembers.joinedAt }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1);
}

export async function isGroupMember(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: groupMembers.id }).from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1);
  return Boolean(result[0]);
}

export async function listMyGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const memberships = await db.select({ group: groups, role: groupMembers.role }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(eq(groupMembers.userId, userId)).orderBy(desc(groups.createdAt));
  return Promise.all(memberships.map(async membership => {
    const rows = await db.select({ total: count() }).from(groupMembers).where(eq(groupMembers.groupId, membership.group.id));
    return { ...membership.group, role: membership.role, memberCount: Number(rows[0]?.total ?? 0) };
  }));
}

async function getMemberGroupIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId));
  return rows.map(row => row.groupId);
}

export type PdfListParams = {
  q?: string;
  subjectId?: number;
  unit?: string;
  sort?: "latest" | "downloads" | "views" | "az";
  page?: number;
  pageSize?: number;
  userId?: number;
};

function pdfSelect() {
  return {
    id: pdfFiles.id,
    title: pdfFiles.title,
    groupId: pdfFiles.groupId,
    unit: pdfFiles.unit,
    description: pdfFiles.description,
    tags: pdfFiles.tags,
    fileName: pdfFiles.fileName,
    fileUrl: pdfFiles.fileUrl,
    fileSize: pdfFiles.fileSize,
    uploadedBy: pdfFiles.uploadedBy,
    academicYear: pdfFiles.academicYear,
    semester: pdfFiles.semester,
    viewCount: pdfFiles.viewCount,
    downloadCount: pdfFiles.downloadCount,
    createdAt: pdfFiles.createdAt,
    subjectId: subjects.id,
    subjectName: subjects.name,
    uploaderName: users.name,
  };
}

export async function listPdfs(params: PdfListParams = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page: params.page ?? 1, pageSize: params.pageSize ?? 20 };
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 20);
  const filters = [];
  if (params.subjectId) filters.push(eq(pdfFiles.subjectId, params.subjectId));
  if (params.unit) filters.push(eq(pdfFiles.unit, params.unit));
  if (params.q?.trim()) {
    const q = `%${params.q.trim()}%`;
    filters.push(or(like(pdfFiles.title, q), like(subjects.name, q), like(pdfFiles.description, q), like(pdfFiles.tags, q), like(pdfFiles.unit, q)));
  }
  const groupIds = params.userId ? await getMemberGroupIds(params.userId) : [];
  filters.push(groupIds.length ? or(isNull(pdfFiles.groupId), inArray(pdfFiles.groupId, groupIds)) : isNull(pdfFiles.groupId));
  const where = filters.length ? and(...filters) : undefined;
  const orderBy = params.sort === "downloads" ? desc(pdfFiles.downloadCount) : params.sort === "views" ? desc(pdfFiles.viewCount) : params.sort === "az" ? asc(pdfFiles.title) : desc(pdfFiles.createdAt);
  const [items, totalRows] = await Promise.all([
    db.select(pdfSelect()).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).leftJoin(users, eq(pdfFiles.uploadedBy, users.id)).where(where).orderBy(orderBy).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).where(where),
  ]);
  return { items, total: Number(totalRows[0]?.total ?? 0), page, pageSize };
}

export async function getPdfById(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select(pdfSelect()).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).leftJoin(users, eq(pdfFiles.uploadedBy, users.id)).where(eq(pdfFiles.id, id)).limit(1);
  const pdf = result[0];
  if (pdf?.groupId && (!userId || !(await isGroupMember(pdf.groupId, userId)))) return undefined;
  return pdf;
}

export async function getPdfStorageRecord(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ id: pdfFiles.id, groupId: pdfFiles.groupId, fileKey: pdfFiles.fileKey, fileName: pdfFiles.fileName, fileSize: pdfFiles.fileSize, uploadedBy: pdfFiles.uploadedBy }).from(pdfFiles).where(eq(pdfFiles.id, id)).limit(1);
  const record = result[0];
  if (record?.groupId && (!userId || !(await isGroupMember(record.groupId, userId)))) return undefined;
  return record;
}

export async function getMyUploads(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select(pdfSelect()).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).leftJoin(users, eq(pdfFiles.uploadedBy, users.id)).where(eq(pdfFiles.uploadedBy, userId)).orderBy(desc(pdfFiles.createdAt));
}

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { uploads: 0, downloads: 0, subjects: 0, views: 0 };
  const [uploadRows, downloadRows, subjectRows, viewRows] = await Promise.all([
    db.select({ total: count() }).from(pdfFiles).where(eq(pdfFiles.uploadedBy, userId)),
    db.select({ total: sum(pdfFiles.downloadCount) }).from(pdfFiles).where(eq(pdfFiles.uploadedBy, userId)),
    db.select({ total: count() }).from(subjects).where(eq(subjects.createdBy, userId)),
    db.select({ total: sum(pdfFiles.viewCount) }).from(pdfFiles).where(eq(pdfFiles.uploadedBy, userId)),
  ]);
  return { uploads: Number(uploadRows[0]?.total ?? 0), downloads: Number(downloadRows[0]?.total ?? 0), subjects: Number(subjectRows[0]?.total ?? 0), views: Number(viewRows[0]?.total ?? 0) };
}

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return undefined;
  const stats = await getDashboardStats(userId);
  return { ...user[0], ...stats };
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { students: 0, pdfs: 0, subjects: 0, downloads: 0, recentUploads: [], reports: [] };
  const [studentRows, pdfRows, subjectRows, downloadRows, recentUploads, reportRows] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(pdfFiles),
    db.select({ total: count() }).from(subjects),
    db.select({ total: sum(pdfFiles.downloadCount) }).from(pdfFiles),
    db.select(pdfSelect()).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).leftJoin(users, eq(pdfFiles.uploadedBy, users.id)).orderBy(desc(pdfFiles.createdAt)).limit(6),
    db.select({ id: reports.id, pdfId: reports.pdfId, reason: reports.reason, description: reports.description, status: reports.status, createdAt: reports.createdAt, pdfTitle: pdfFiles.title }).from(reports).leftJoin(pdfFiles, eq(reports.pdfId, pdfFiles.id)).orderBy(desc(reports.createdAt)).limit(8),
  ]);
  return { students: Number(studentRows[0]?.total ?? 0), pdfs: Number(pdfRows[0]?.total ?? 0), subjects: Number(subjectRows[0]?.total ?? 0), downloads: Number(downloadRows[0]?.total ?? 0), recentUploads, reports: reportRows };
}
