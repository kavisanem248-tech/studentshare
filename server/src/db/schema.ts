import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Users Table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['STUDENT', 'ADMIN'] }).notNull().default('STUDENT'),
  department: text('department'),
  year: text('year'),
  semester: text('semester'),
  avatar: text('avatar'),
  bio: text('bio'),
  isBanned: integer('is_banned', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role),
]);

// Categories Table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
});

// Materials Table
export const materials = sqliteTable('materials', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  description: text('description').default(''),
  tags: text('tags').default(''), // comma-separated or json string
  department: text('department').notNull(),
  year: text('year').notNull(),
  semester: text('semester').notNull(),
  unit: text('unit').notNull(),
  materialType: text('material_type').notNull(), // Notes, Question Bank, Lab Manual, etc.
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(), // pdf, docx, pptx, etc.
  uploaderId: text('uploader_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  downloadCount: integer('download_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  averageRating: real('average_rating').notNull().default(0),
  ratingCount: integer('rating_count').notNull().default(0),
  isApproved: integer('is_approved', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('materials_subject_idx').on(table.subject),
  index('materials_dept_idx').on(table.department),
  index('materials_type_idx').on(table.materialType),
  index('materials_uploader_idx').on(table.uploaderId),
]);

// Saved Materials Table (Bookmarks)
export const savedMaterials = sqliteTable('saved_materials', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  materialId: text('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('saved_user_material_idx').on(table.userId, table.materialId),
  index('saved_user_idx').on(table.userId),
]);

// Downloads Table (Download History)
export const downloads = sqliteTable('downloads', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  materialId: text('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  downloadedAt: text('downloaded_at').notNull(),
}, (table) => [
  index('downloads_user_idx').on(table.userId),
  index('downloads_material_idx').on(table.materialId),
]);

// Ratings Table
export const ratings = sqliteTable('ratings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  materialId: text('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1 to 5
  review: text('review'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  uniqueIndex('ratings_user_material_idx').on(table.userId, table.materialId),
  index('ratings_material_idx').on(table.materialId),
]);

// Reports Table
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  materialId: text('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(), // Incorrect content, Duplicate, Inappropriate, Copyright concern, Spam, Other
  details: text('details'),
  status: text('status', { enum: ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED'] }).notNull().default('PENDING'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('reports_status_idx').on(table.status),
  index('reports_material_idx').on(table.materialId),
]);

// Friend Circles Table
export const circles = sqliteTable('circles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').default(''),
  passwordHash: text('password_hash').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('circles_owner_idx').on(table.ownerId),
]);

// Circle Members Table
export const circleMembers = sqliteTable('circle_members', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['OWNER', 'MEMBER'] }).notNull().default('MEMBER'),
  joinedAt: text('joined_at').notNull(),
}, (table) => [
  uniqueIndex('circle_user_idx').on(table.circleId, table.userId),
  index('circle_members_circle_idx').on(table.circleId),
  index('circle_members_user_idx').on(table.userId),
]);

// Circle Materials Table (Materials shared privately in a circle)
export const circleMaterials = sqliteTable('circle_materials', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  materialId: text('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  sharedBy: text('shared_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('circle_material_idx').on(table.circleId, table.materialId),
  index('circle_materials_circle_idx').on(table.circleId),
]);

// Announcements Table (Circle Announcements)
export const announcements = sqliteTable('announcements', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('announcements_circle_idx').on(table.circleId),
]);

// Notifications Table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // MATERIAL_UPLOAD, CIRCLE_ANNOUNCEMENT, CIRCLE_INVITE, CIRCLE_REMOVAL, REPORT_STATUS, SYSTEM
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('notifications_user_idx').on(table.userId),
  index('notifications_read_idx').on(table.isRead),
]);
