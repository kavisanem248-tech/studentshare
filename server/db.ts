import { and, asc, count, desc, eq, like, or, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  downloads,
  pdfFiles,
  reports,
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
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
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

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
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

export type PdfListParams = {
  q?: string;
  subjectId?: number;
  unit?: string;
  sort?: "latest" | "downloads" | "views" | "az";
  page?: number;
  pageSize?: number;
};

function pdfSelect() {
  return {
    id: pdfFiles.id,
    title: pdfFiles.title,
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
  const where = filters.length ? and(...filters) : undefined;
  const orderBy = params.sort === "downloads" ? desc(pdfFiles.downloadCount) : params.sort === "views" ? desc(pdfFiles.viewCount) : params.sort === "az" ? asc(pdfFiles.title) : desc(pdfFiles.createdAt);
  const [items, totalRows] = await Promise.all([
    db.select(pdfSelect()).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).leftJoin(users, eq(pdfFiles.uploadedBy, users.id)).where(where).orderBy(orderBy).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).where(where),
  ]);
  return { items, total: Number(totalRows[0]?.total ?? 0), page, pageSize };
}

export async function getPdfById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select(pdfSelect()).from(pdfFiles).leftJoin(subjects, eq(pdfFiles.subjectId, subjects.id)).leftJoin(users, eq(pdfFiles.uploadedBy, users.id)).where(eq(pdfFiles.id, id)).limit(1);
  return result[0];
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
