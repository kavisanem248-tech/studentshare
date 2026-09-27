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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (networkErr: any) {
      console.error('[ApiService] Network request failed:', networkErr);
      throw new Error(
        'Unable to connect to StudentShare backend server (Network Error). Please verify the server is running on http://localhost:5000.'
      );
    }
    return this.handleResponse<T>(res);
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { error: 'Invalid response received from server.' };
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
    return this.request(`${API_BASE_URL}/health`);
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
    return this.request(`${API_BASE_URL}/auth/providers`);
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
    return this.request(`${API_BASE_URL}/auth/register`, {
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
    return this.request(`${API_BASE_URL}/auth/login`, {
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
    return this.request(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async getMe(): Promise<{ success: boolean; user: User }> {
    return this.request(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(body: { email: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.request(`${API_BASE_URL}/auth/reset-password`, {
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
    const res = await fetch(`${API_BASE_URL}/materials?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
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
    const res = await fetch(`${API_BASE_URL}/materials/search?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getMaterialById(id: string): Promise<{ success: boolean; data: Material }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async uploadMaterial(formData: FormData): Promise<{ success: boolean; data: Material; message: string }> {
    const res = await fetch(`${API_BASE_URL}/materials`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    return this.handleResponse(res);
  }

  async updateMaterial(
    id: string,
    body: Partial<Material>
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(res);
  }

  async deleteMaterial(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/materials/${id}/download`;
  }

  getPreviewUrl(id: string): string {
    return `${API_BASE_URL}/materials/${id}/preview`;
  }

  async saveMaterial(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}/save`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async unsaveMaterial(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}/save`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async rateMaterial(
    id: string,
    rating: number,
    review?: string
  ): Promise<{ success: boolean; message: string; averageRating: number; ratingCount: number }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}/rate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ rating, review }),
    });
    return this.handleResponse(res);
  }

  async reportMaterial(
    id: string,
    reason: string,
    details?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}/report`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason, details }),
    });
    return this.handleResponse(res);
  }

  async getAiSummary(id: string): Promise<{
    success: boolean;
    configured: boolean;
    summary?: string;
    keyPoints?: string[];
    message?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/materials/${id}/ai-summary`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
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
    const res = await fetch(`${API_BASE_URL}/materials/${id}/ai-ask`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ question }),
    });
    return this.handleResponse(res);
  }

  // User Student Area
  async getSavedMaterials(): Promise<{ success: boolean; data: Material[] }> {
    const res = await fetch(`${API_BASE_URL}/user/saved`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getDownloadHistory(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE_URL}/user/downloads`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getMyUploads(): Promise<{ success: boolean; data: Material[] }> {
    const res = await fetch(`${API_BASE_URL}/user/uploads`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async updateProfile(body: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(res);
  }

  async changePassword(body: { oldPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/user/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(res);
  }

  // Friend Circles
  async getMyCircles(): Promise<{ success: boolean; data: CircleSummary[] }> {
    const res = await fetch(`${API_BASE_URL}/circles`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createCircle(body: {
    name: string;
    password: string;
    description?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    const res = await fetch(`${API_BASE_URL}/circles`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(res);
  }

  async joinCircle(body: {
    name: string;
    password: string;
  }): Promise<{ success: boolean; message: string; circleId: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/join`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(res);
  }

  async getCircleDetails(id: string): Promise<{ success: boolean; data: CircleDetail }> {
    const res = await fetch(`${API_BASE_URL}/circles/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async leaveCircle(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${id}/leave`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async deleteCircle(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async updateCirclePassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${id}/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    return this.handleResponse(res);
  }

  async removeCircleMember(circleId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${circleId}/members/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async shareCircleMaterial(circleId: string, materialId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${circleId}/materials`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ materialId }),
    });
    return this.handleResponse(res);
  }

  async removeCircleMaterial(circleId: string, materialId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${circleId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createAnnouncement(circleId: string, body: { title: string; content: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${circleId}/announcements`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(res);
  }

  async deleteAnnouncement(circleId: string, announcementId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/circles/${circleId}/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // Notifications
  async getNotifications(): Promise<{ success: boolean; data: NotificationItem[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async markNotificationRead(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // Admin APIs
  async getAdminStats(): Promise<{ success: boolean; data: AdminStats }> {
    const res = await fetch(`${API_BASE_URL}/admin/statistics`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getAdminUsers(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async toggleUserBan(id: string, isBanned: boolean): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/ban`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ isBanned }),
    });
    return this.handleResponse(res);
  }

  async updateUserRole(id: string, role: 'STUDENT' | 'ADMIN'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    return this.handleResponse(res);
  }

  async getAdminMaterials(): Promise<{ success: boolean; data: Material[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/materials`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async toggleMaterialApproval(id: string, isApproved: boolean): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/materials/${id}/approve`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ isApproved }),
    });
    return this.handleResponse(res);
  }

  async deleteAdminMaterial(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/materials/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getAdminReports(): Promise<{ success: boolean; data: ReportItem[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/reports`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async updateReportStatus(id: string, status: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse(res);
  }

  async getAdminCircles(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/circles`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async deleteAdminCircle(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/circles/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getCategories(): Promise<{ success: boolean; data: Category[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createCategory(body: { name: string; code: string; description?: string }): Promise<{ success: boolean; data: Category }> {
    const res = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(res);
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  getBaseUrl(): string {
    return API_BASE_URL;
  }
}

export const api = new ApiService();
