export type UserRole = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  year?: string | null;
  semester?: string | null;
  avatar?: string | null;
  bio?: string | null;
  createdAt?: string;
  isBanned?: boolean;
}

export interface Material {
  id: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  tags: string[];
  department: string;
  year: string;
  semester: string;
  unit: string;
  materialType: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploaderId: string;
  uploaderName?: string;
  uploaderAvatar?: string;
  uploaderDept?: string;
  uploaderEmail?: string;
  downloadCount: number;
  viewCount: number;
  averageRating: number;
  ratingCount: number;
  isApproved?: boolean;
  createdAt: string;
  updatedAt?: string;
  isSaved?: boolean;
  userRating?: number | null;
  reviews?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  review?: string | null;
  created_at: string;
  user_name: string;
  user_avatar?: string | null;
}

export interface CircleMember {
  membership_id: string;
  user_id: string;
  role: 'OWNER' | 'MEMBER';
  joined_at: string;
  name: string;
  email: string;
  avatar?: string | null;
  department?: string | null;
  year?: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar?: string | null;
}

export interface CircleDetail {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string | null;
  myRole: 'OWNER' | 'MEMBER' | 'ADMIN_VIEW';
  createdAt: string;
  members: CircleMember[];
  announcements: Announcement[];
  materials: Material[];
}

export interface CircleSummary {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  owner_name: string;
  owner_avatar?: string | null;
  role: 'OWNER' | 'MEMBER';
  joined_at: string;
  member_count: number;
  material_count: number;
  announcement_count: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'MATERIAL_UPLOAD' | 'CIRCLE_ANNOUNCEMENT' | 'CIRCLE_INVITE' | 'CIRCLE_REMOVAL' | 'REPORT_STATUS' | 'SYSTEM';
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  user_id: string;
  material_id: string;
  material_title: string;
  material_subject: string;
  reporter_name: string;
  reporter_email: string;
  uploader_name: string;
  reason: string;
  details?: string | null;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMaterials: number;
  totalDownloads: number;
  totalCircles: number;
  pendingReports: number;
  recentMaterials: Array<{
    id: string;
    title: string;
    subject: string;
    department: string;
    created_at: string;
    uploader_name: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    created_at: string;
    is_banned: number | boolean;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
