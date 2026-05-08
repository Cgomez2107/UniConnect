import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiResponse, AuthProfile, LoginFormData } from "@/types";

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const authService = {
  async login(data: LoginFormData): Promise<AuthProfile> {
    const response = await apiClient.post<ApiResponse<AuthProfile>>(
      API_ENDPOINTS.AUTH_LOGIN,
      data
    );
    const user = response.data.data;
    if (user && response.data.data?.id) {
      localStorage.setItem("accessToken", (response.headers.authorization || "").replace("Bearer ", ""));
      localStorage.setItem("user", JSON.stringify(user));
    }
    return user || ({} as AuthProfile);
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  },

  async getMe(): Promise<AuthProfile> {
    const response = await apiClient.get<ApiResponse<AuthProfile>>(API_ENDPOINTS.AUTH_ME);
    return response.data.data || ({} as AuthProfile);
  },

  async googleAuth(code: string): Promise<AuthProfile> {
    const response = await apiClient.post<ApiResponse<AuthProfile>>(
      API_ENDPOINTS.AUTH_GOOGLE,
      { code }
    );
    const user = response.data.data;
    if (user) {
      localStorage.setItem("accessToken", (response.headers.authorization || "").replace("Bearer ", ""));
      localStorage.setItem("user", JSON.stringify(user));
    }
    return user || ({} as AuthProfile);
  },

  getStoredUser(): AuthProfile | null {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem("accessToken");
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },
};

export default authService;
