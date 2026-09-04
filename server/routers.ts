import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashSessionToken } from "./_core/sdk";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createSubject,
  addGroupMember,
  createGroup,
  getGroupByCode,
  getAdminStats,
  getDashboardStats,
  getDb,
  getMyUploads,
  getPdfById,
  getProfile,
  isGroupMember,
  listMyGroups,
  listPdfs,
  listSubjects,
  revokeSessionByTokenHash,
} from "./db";
import { storagePut } from "./storage";
import { pdfFiles, reports, subjects, users, views } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const uploadInput = z.object({
  title: z.string().trim().min(2).max(240),
  subjectId: z.number().int().positive(),
  unit: z.string().trim().min(1).max(40),
  description: z.string().trim().max(2000).optional(),
  tags: z.string().trim().max(300).optional(),
  academicYear: z.string().trim().max(20).optional(),
  semester: z.string().trim().max(40).optional(),
  fileName: z.string().trim().regex(/\.pdf$/i, "Only PDF files are allowed."),
  fileType: z.string().refine(value => value === "application/pdf", "Only PDF files are allowed."),
  fileSize: z.number().int().positive().max(Number(process.env.MAX_FILE_SIZE_BYTES || 20 * 1024 * 1024)),
  fileData: z.string().min(1),
  groupId: z.number().int().positive().nullable().optional(),
});

const pdfIdInput = z.object({ id: z.number().int().positive() });

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookies = parseCookieHeader(ctx.req.headers.cookie ?? "");
      const bearer = typeof ctx.req.headers.authorization === "string" && ctx.req.headers.authorization.startsWith("Bearer ")
        ? ctx.req.headers.authorization.slice(7)
        : undefined;
      const token = cookies[COOKIE_NAME] || bearer;
      if (token) await revokeSessionByTokenHash(hashSessionToken(token));
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      return { success: true } as const;
    }),
  }),
  subjects: router({
    list: publicProcedure.query(() => listSubjects()),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), code: z.string().trim().max(40).optional(), department: z.string().trim().max(120).optional(), semester: z.string().trim().max(40).optional() })).mutation(({ input, ctx }) => createSubject({ ...input, createdBy: ctx.user.id })),
  }),
  groups: router({
    mine: protectedProcedure.query(({ ctx }) => listMyGroups(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(120), password: z.string().min(8).max(120) })).mutation(async ({ input, ctx }) => {
      const passwordHash = await bcrypt.hash(input.password, 12);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const groupId = `FRIEND-${randomBytes(3).toString("hex").toUpperCase()}`;
        try {
          const group = await createGroup({ groupId, name: input.name, passwordHash, createdBy: ctx.user.id });
          return group && { id: group.id, groupId: group.groupId, name: group.name, createdAt: group.createdAt };
        }
        catch (error) { if (attempt === 2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create the group. Please try again." }); }
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create the group. Please try again." });
    }),
    join: protectedProcedure.input(z.object({ groupId: z.string().trim().min(4).max(32), password: z.string().min(1).max(120) })).mutation(async ({ input, ctx }) => {
      const group = await getGroupByCode(input.groupId.toUpperCase());
      if (!group || !(await bcrypt.compare(input.password, group.passwordHash))) throw new TRPCError({ code: "FORBIDDEN", message: "That group ID or password is incorrect." });
      await addGroupMember(group.id, ctx.user.id);
      return { success: true, group: { id: group.id, groupId: group.groupId, name: group.name } };
    }),
  }),
  pdfs: router({
    list: publicProcedure.input(z.object({ q: z.string().optional(), subjectId: z.number().int().positive().optional(), unit: z.string().optional(), sort: z.enum(["latest", "downloads", "views", "az"]).optional(), page: z.number().int().positive().optional() }).optional()).query(({ input, ctx }) => listPdfs({ ...input, userId: ctx.user?.id })),
    get: publicProcedure.input(pdfIdInput).query(({ input, ctx }) => getPdfById(input.id, ctx.user?.id)),
    upload: protectedProcedure.input(uploadInput).mutation(async ({ input, ctx }) => {
      const baseName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180);
      const key = `studentshare/${ctx.user.id}/${Date.now()}-${baseName}`;
      let stored;
      try {
        stored = await storagePut(key, Buffer.from(input.fileData, "base64"), "application/pdf");
      } catch (error) {
        console.error("[StudentShare] storage upload failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong while uploading your PDF. Please try again." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      if (input.groupId && !(await isGroupMember(input.groupId, ctx.user.id))) throw new TRPCError({ code: "FORBIDDEN", message: "Join this group before uploading into it." });
      const result = await db.insert(pdfFiles).values({
        title: input.title,
        subjectId: input.subjectId,
        groupId: input.groupId || null,
        unit: input.unit,
        description: input.description || null,
        tags: input.tags || null,
        fileName: baseName,
        fileKey: stored.key,
        fileUrl: stored.url,
        fileSize: input.fileSize,
        uploadedBy: ctx.user.id,
        academicYear: input.academicYear || null,
        semester: input.semester || null,
      });
      const id = Number(result[0].insertId);
      const pdf = await getPdfById(id, ctx.user.id);
      if (!pdf) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PDF was uploaded but could not be loaded." });
      return { success: true, id, pdf, message: "PDF uploaded successfully!" };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(2).max(240), subjectId: z.number().int().positive(), unit: z.string().trim().min(1).max(40), description: z.string().trim().max(2000).optional(), tags: z.string().trim().max(300).optional(), academicYear: z.string().trim().max(20).optional(), semester: z.string().trim().max(40).optional() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const owned = await db.select({ id: pdfFiles.id }).from(pdfFiles).where(eq(pdfFiles.id, input.id)).limit(1);
      const record = await db.select().from(pdfFiles).where(eq(pdfFiles.id, input.id)).limit(1);
      if (!record[0]) throw new TRPCError({ code: "NOT_FOUND", message: "PDF not found." });
      if (record[0].uploadedBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own uploads." });
      await db.update(pdfFiles).set({ title: input.title, subjectId: input.subjectId, unit: input.unit, description: input.description || null, tags: input.tags || null, academicYear: input.academicYear || null, semester: input.semester || null }).where(eq(pdfFiles.id, owned[0].id));
      return { success: true };
    }),
    remove: protectedProcedure.input(pdfIdInput).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const record = await db.select().from(pdfFiles).where(eq(pdfFiles.id, input.id)).limit(1);
      if (!record[0]) throw new TRPCError({ code: "NOT_FOUND", message: "PDF not found." });
      if (record[0].uploadedBy !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own uploads." });
      await db.delete(pdfFiles).where(eq(pdfFiles.id, input.id));
      return { success: true };
    }),
    view: publicProcedure.input(pdfIdInput).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };
      if (!(await getPdfById(input.id, ctx.user?.id))) throw new TRPCError({ code: "NOT_FOUND", message: "PDF not found." });
      await db.insert(views).values({ pdfId: input.id, userId: ctx.user?.id ?? null });
      await db.update(pdfFiles).set({ viewCount: sql`${pdfFiles.viewCount} + 1` }).where(eq(pdfFiles.id, input.id));
      return { success: true };
    }),
    download: publicProcedure.input(pdfIdInput).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const pdf = await getPdfById(input.id, ctx.user?.id);
      if (!pdf) throw new TRPCError({ code: "NOT_FOUND", message: "PDF not found." });
      return { success: true, url: `/api/pdfs/${pdf.id}/download` };
    }),
    report: protectedProcedure.input(z.object({ pdfId: z.number().int().positive(), reason: z.string().trim().min(2).max(80), description: z.string().trim().max(1000).optional() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.insert(reports).values({ pdfId: input.pdfId, reportedBy: ctx.user.id, reason: input.reason, description: input.description || null });
      return { success: true };
    }),
  }),
  dashboard: router({
    stats: protectedProcedure.query(({ ctx }) => getDashboardStats(ctx.user.id)),
    recent: publicProcedure.query(({ ctx }) => listPdfs({ page: 1, pageSize: 6, sort: "latest", userId: ctx.user?.id })),
    popular: publicProcedure.query(({ ctx }) => listPdfs({ page: 1, pageSize: 6, sort: "downloads", userId: ctx.user?.id })),
  }),
  uploads: router({
    mine: protectedProcedure.query(({ ctx }) => getMyUploads(ctx.user.id)),
  }),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.id)),
    update: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(120) })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.update(users).set({ name: input.name }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
  }),
  admin: router({
    stats: adminProcedure.query(() => getAdminStats()),
    resolveReport: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["resolved", "rejected"]) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.update(reports).set({ status: input.status }).where(eq(reports.id, input.id));
      return { success: true };
    }),
    removePdf: adminProcedure.input(pdfIdInput).mutation(({ input }) => {
      return getDb().then(async db => {
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        await db.delete(pdfFiles).where(eq(pdfFiles.id, input.id));
        return { success: true };
      });
    }),
    deleteSubject: adminProcedure.input(pdfIdInput).mutation(({ input }) => {
      return getDb().then(async db => {
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        await db.delete(subjects).where(eq(subjects.id, input.id));
        return { success: true };
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;
