import {
  User,
  Material,
  CircleSummary,
  CircleDetail,
  NotificationItem,
  ReportItem,
  Category,
  AdminStats,
  PaginatedResult,
} from '../types';

// Default backend URLs
const DEFAULT_DEV_BACKEND_URL = 'http://localhost:5000';
const DEFAULT_PROD_BACKEND_URL = 'https://studentshare-backend-map3.onrender.com';

/**
 * Resolves and normalizes the backend API base URL.
 * Handles trailing slashes, missing /api paths, environment overrides,
 * prevents duplicate /api/api pathing, eliminates hardcoded local addresses in production,
 * and maintains localhost:5000 for local development.
 */
function resolveApiBaseUrl(): string {
  const isDev = Boolean(import.meta.env.DEV);
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  let url: string;

  if (isDev) {
    // Development mode:
    // Prefer VITE_API_URL if explicitly provided; otherwise default to http://localhost:5000
    url = envUrl || DEFAULT_DEV_BACKEND_URL;
  } else {
    // Production mode (build / production deployment):
    // Use VITE_API_URL if valid remote URL; otherwise safely default to live Render backend
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      url = envUrl;
    } else {
      url = DEFAULT_PROD_BACKEND_URL;
    }
  }

  // Runtime safety: if running in a non-localhost browser window, never target localhost
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = DEFAULT_PROD_BACKEND_URL;
    }
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Remove duplicate /api segments if already present (e.g., https://.../api/api)
  url = url.replace(/\/api\/+api(\/|$)/g, '/api$1');

  // Ensure it ends with /api (without duplicating /api)
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
}

const API_BASE_URL = resolveApiBaseUrl();

class ApiService {
  private getHeaders(isFormData = false): HeadersInit {
    const token = localStorage.getItem('studentshare_token');
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(endpointOrUrl: string, init?: RequestInit): Promise<T> {
    let targetUrl: string;

    if (endpointOrUrl.startsWith('http://') || endpointOrUrl.startsWith('https://')) {
      targetUrl = endpointOrUrl;
    } else {
      // Prevent duplicated /api/api if endpoint already begins with /api
      let cleanEndpoint = endpointOrUrl.trim();
      if (cleanEndpoint.startsWith('/api/')) {
        cleanEndpoint = cleanEndpoint.substring(4);
      } else if (cleanEndpoint === '/api') {
        cleanEndpoint = '';
      }

      const slash = cleanEndpoint.startsWith('/') || cleanEndpoint === '' ? '' : '/';
      targetUrl = `${API_BASE_URL}${slash}${cleanEndpoint}`;
    }

    // Guard against any accidental /api/api in the constructed URL
    targetUrl = targetUrl.replace(/\/api\/+api(\/|$)/g, '/api$1');

    let res: Response;
    try {
      res = await fetch(targetUrl, {
        credentials: 'include',
        ...init,
      });
    } catch (networkErr: any) {
      console.error('[ApiService] Network request failed:', targetUrl, networkErr);
      throw new Error(
        'Unable to connect to StudentShare backend server. Please verify your internet connection or try again later.'
      );
    }
    return this.handleResponse<T>(res);
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { error: `Invalid response received from server (HTTP ${res.status}).` };
    }

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with HTTP status ${res.status}`;
      const error: any = new Error(errorMsg);
      if (data && typeof data === 'object') {
        Object.assign(error, data);
      }
      throw error;
    }

    return data as T;
  }

  // Health
  async getHealth(): Promise<{ status: string; service: string; database: string }> {
    return this.request('/health');
  }

  // Auth Providers configuration check
  async getAuthProviders(): Promise<{
    success: boolean;
    providers: {
      google: { configured: boolean; clientId: string | null };
      emailPassword: { configured: boolean };
      ai: { configured: boolean };
    };
  }> {
    return this.request('/auth/providers');
  }

  // Authentication
  async register(body: {
    name: string;
    email: string;
    password: string;
    department?: string;
    year?: string;
    semester?: string;
  }): Promise<{ success: boolean; token: string; user: User; message: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async login(body: { email: string; password: string }): Promise<{
    success: boolean;
    token: string;
    user: User;
    message: string;
  }> {
    return this.request('/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async googleLogin(body: { email: string; name?: string }): Promise<{
    success: boolean;
    token: string;
    user: User;
    message: string;
  }> {
    return this.request('/auth/google', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async getMe(): Promise<{ success: boolean; user: User }> {
    return this.request('/auth/me', {
      headers: this.getHeaders(),
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(body: { email: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  // Materials
  async getMaterials(params?: {
    department?: string;
    year?: string;
    semester?: string;
    unit?: string;
    materialType?: string;
    subject?: string;
    uploaderId?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Material>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PaginatedResult<Material>>(`/materials${qs}`, {
      headers: this.getHeaders(),
    });
  }

  async searchMaterials(params: {
    q: string;
    department?: string;
    year?: string;
    semester?: string;
    unit?: string;
    materialType?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Material>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PaginatedResult<Material>>(`/materials/search${qs}`, {
      headers: this.getHeaders(),
    });
  }

  async getMaterialById(id: string): Promise<{ success: boolean; data: Material }> {
    return this.request(`/materials/${id}`, {
      headers: this.getHeaders(),
    });
  }

  async uploadMaterial(formData: FormData): Promise<{ success: boolean; data: Material; message: string }> {
    return this.request(`/materials`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
  }

  async updateMaterial(
    id: string,
    body: Partial<Material>
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/materials/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async deleteMaterial(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/materials/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  getDownloadUrl(id: string): string {
    const url = `${API_BASE_URL}/materials/${id}/download`;
    return url.replace(/\/api\/+api(\/|$)/g, '/api$1');
  }

  getPreviewUrl(id: string): string {
    const url = `${API_BASE_URL}/materials/${id}/preview`;
    return url.replace(/\/api\/+api(\/|$)/g, '/api$1');
  }

  async saveMaterial(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/materials/${id}/save`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  async unsaveMaterial(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/materials/${id}/save`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async rateMaterial(
    id: string,
    rating: number,
    review?: string
  ): Promise<{ success: boolean; message: string; averageRating: number; ratingCount: number }> {
    return this.request(`/materials/${id}/rate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ rating, review }),
    });
  }

  async reportMaterial(
    id: string,
    reason: string,
    details?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/materials/${id}/report`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason, details }),
    });
  }

  async getAiSummary(id: string): Promise<{
    success: boolean;
    configured: boolean;
    summary?: string;
    keyPoints?: string[];
    message?: string;
  }> {
    return this.request(`/materials/${id}/ai-summary`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  async askAiQuestion(
    id: string,
    question: string
  ): Promise<{
    success: boolean;
    configured: boolean;
    answer?: string;
    message?: string;
  }> {
    return this.request(`/materials/${id}/ai-ask`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ question }),
    });
  }

  // User Student Area
  async getSavedMaterials(): Promise<{ success: boolean; data: Material[] }> {
    return this.request(`/user/saved`, {
      headers: this.getHeaders(),
    });
  }

  async getDownloadHistory(): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/user/downloads`, {
      headers: this.getHeaders(),
    });
  }

  async getMyUploads(): Promise<{ success: boolean; data: Material[] }> {
    return this.request(`/user/uploads`, {
      headers: this.getHeaders(),
    });
  }

  async updateProfile(body: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    return this.request(`/user/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async changePassword(body: { oldPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.request(`/user/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  // Friend Circles
  async getMyCircles(): Promise<{ success: boolean; data: CircleSummary[] }> {
    return this.request(`/circles`, {
      headers: this.getHeaders(),
    });
  }

  async createCircle(body: {
    name: string;
    password: string;
    description?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return this.request(`/circles`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async joinCircle(body: {
    name: string;
    password: string;
  }): Promise<{ success: boolean; message: string; circleId: string }> {
    return this.request(`/circles/join`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async getCircleDetails(id: string): Promise<{ success: boolean; data: CircleDetail }> {
    return this.request(`/circles/${id}`, {
      headers: this.getHeaders(),
    });
  }

  async leaveCircle(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${id}/leave`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  async deleteCircle(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async updateCirclePassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${id}/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
  }

  async removeCircleMember(circleId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${circleId}/members/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async shareCircleMaterial(circleId: string, materialId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${circleId}/materials`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ materialId }),
    });
  }

  async removeCircleMaterial(circleId: string, materialId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${circleId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async createAnnouncement(circleId: string, body: { title: string; content: string }): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${circleId}/announcements`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async deleteAnnouncement(circleId: string, announcementId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/circles/${circleId}/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // Notifications
  async getNotifications(): Promise<{ success: boolean; data: NotificationItem[]; unreadCount: number }> {
    return this.request(`/notifications`, {
      headers: this.getHeaders(),
    });
  }

  async markNotificationRead(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    return this.request(`/notifications/read-all`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
  }

  // Admin APIs
  async getAdminStats(): Promise<{ success: boolean; data: AdminStats }> {
    return this.request(`/admin/statistics`, {
      headers: this.getHeaders(),
    });
  }

  async getAdminUsers(): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/admin/users`, {
      headers: this.getHeaders(),
    });
  }

  async toggleUserBan(id: string, isBanned: boolean): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ isBanned }),
    });
  }

  async updateUserRole(id: string, role: 'STUDENT' | 'ADMIN'): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/users/${id}/role`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
  }

  async getAdminMaterials(): Promise<{ success: boolean; data: Material[] }> {
    return this.request(`/admin/materials`, {
      headers: this.getHeaders(),
    });
  }

  async toggleMaterialApproval(id: string, isApproved: boolean): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/materials/${id}/approve`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ isApproved }),
    });
  }

  async deleteAdminMaterial(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/materials/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async getAdminReports(): Promise<{ success: boolean; data: ReportItem[] }> {
    return this.request(`/admin/reports`, {
      headers: this.getHeaders(),
    });
  }

  async updateReportStatus(id: string, status: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
  }

  async getAdminCircles(): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/admin/circles`, {
      headers: this.getHeaders(),
    });
  }

  async deleteAdminCircle(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/circles/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async getCategories(): Promise<{ success: boolean; data: Category[] }> {
    return this.request(`/admin/categories`, {
      headers: this.getHeaders(),
    });
  }

  async createCategory(body: { name: string; code: string; description?: string }): Promise<{ success: boolean; data: Category }> {
    return this.request(`/admin/categories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  getBaseUrl(): string {
    return API_BASE_URL.replace(/\/api\/+api(\/|$)/g, '/api$1');
  }
}

export const api = new ApiService();
