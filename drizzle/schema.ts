import {
  int,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const subjects = mysqlTable(
  "subjects",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    code: varchar("code", { length: 40 }),
    department: varchar("department", { length: 120 }),
    semester: varchar("semester", { length: 40 }),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    subjectNameIdx: uniqueIndex("subjects_name_code_idx").on(table.name, table.code),
    createdByIdx: index("subjects_created_by_idx").on(table.createdBy),
  }),
);

export const pdfFiles = mysqlTable(
  "pdf_files",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 240 }).notNull(),
    subjectId: int("subjectId").notNull().references(() => subjects.id, { onDelete: "restrict" }),
    unit: varchar("unit", { length: 40 }).notNull(),
    description: text("description"),
    tags: text("tags"),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileKey: varchar("fileKey", { length: 500 }).notNull().unique(),
    fileUrl: varchar("fileUrl", { length: 600 }).notNull(),
    fileSize: int("fileSize").notNull(),
    uploadedBy: int("uploadedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
    academicYear: varchar("academicYear", { length: 20 }),
    semester: varchar("semester", { length: 40 }),
    viewCount: int("viewCount").default(0).notNull(),
    downloadCount: int("downloadCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    subjectIdx: index("pdf_subject_idx").on(table.subjectId),
    uploaderIdx: index("pdf_uploader_idx").on(table.uploadedBy),
    titleIdx: index("pdf_title_idx").on(table.title),
    createdAtIdx: index("pdf_created_at_idx").on(table.createdAt),
    downloadsIdx: index("pdf_downloads_idx").on(table.downloadCount),
  }),
);

export const downloads = mysqlTable(
  "downloads",
  {
    id: int("id").autoincrement().primaryKey(),
    pdfId: int("pdfId").notNull().references(() => pdfFiles.id, { onDelete: "cascade" }),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    downloadedAt: timestamp("downloadedAt").defaultNow().notNull(),
  },
  table => ({
    pdfIdx: index("downloads_pdf_idx").on(table.pdfId),
    userIdx: index("downloads_user_idx").on(table.userId),
  }),
);

export const views = mysqlTable(
  "views",
  {
    id: int("id").autoincrement().primaryKey(),
    pdfId: int("pdfId").notNull().references(() => pdfFiles.id, { onDelete: "cascade" }),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  },
  table => ({
    pdfIdx: index("views_pdf_idx").on(table.pdfId),
    userIdx: index("views_user_idx").on(table.userId),
  }),
);

export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    pdfId: int("pdfId").notNull().references(() => pdfFiles.id, { onDelete: "cascade" }),
    reportedBy: int("reportedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 80 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["open", "resolved", "rejected"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    pdfIdx: index("reports_pdf_idx").on(table.pdfId),
    statusIdx: index("reports_status_idx").on(table.status),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type PdfFile = typeof pdfFiles.$inferSelect;
export type Report = typeof reports.$inferSelect;
