/**
 * @deprecated Use deps.apiClients.auth directly or import from @uniconnect/shared-api.
 * This file is kept as a thin adapter for backward compatibility.
 */
import { deps } from "@/store/deps";
import type { AuthProfile } from "@uniconnect/shared-types";

const authService = {
  async login(data: { email: string; password: string }): Promise<AuthProfile> {
    const response = await deps.apiClients.auth.signIn(data);
    if (response.accessToken) {
      localStorage.setItem("accessToken", response.accessToken);
    }
    if (response.user) {
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    return response.user as AuthProfile;
  },

  async logout(): Promise<void> {
    try {
      await deps.apiClients.auth.signOut();
    } catch {
      // ignore errors during logout
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  },

  async getMe(): Promise<AuthProfile> {
    return deps.apiClients.auth.getCurrentUser();
  },

  async googleAuth(code: string): Promise<AuthProfile> {
    const response = await deps.apiClients.auth.handleOAuthCallback(code, "");
    if (response.accessToken) {
      localStorage.setItem("accessToken", response.accessToken);
    }
    if (response.user) {
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    return response.user as AuthProfile;
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
