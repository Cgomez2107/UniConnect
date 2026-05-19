/**
 * Auth Client
 * Handles authentication and session management
 */

import type { ITransport } from "../transport/index.js";
import {
  mapAuthProfileDtoToDomain,
  mapLoginResponseDtoToDomain,
  mapOAuthCallbackResponseDtoToDomain,
} from "../mappers/index.js";
import type {
  AuthProfileDTO,
  LoginResponseDTO,
  OAuthSignInUrlResponseDTO,
  OAuthCallbackResponseDTO,
  AuthProfile,
  LoginResponse,
  OAuthSignInUrlResponse,
  OAuthCallbackResponse,
} from "@uniconnect/shared-types";

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Auth Client for authentication operations
 */
export class AuthClient {
  constructor(private transport: ITransport) {}

  /**
   * Get OAuth Sign In URL
   */
  async getOAuthSignInUrl(redirectTo: string): Promise<OAuthSignInUrlResponse> {
    const response = await this.transport.request<OAuthSignInUrlResponseDTO>({
      method: "GET",
      url: "/auth/oauth/signin-url",
      params: { redirectTo },
    });

    // Map DTO to domain (though this response doesn't have snake_case fields typically)
    return response.data as OAuthSignInUrlResponse;
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<LoginResponse> {
    const response = await this.transport.request<LoginResponseDTO>({
      method: "POST",
      url: "/auth/signin",
      body: {
        email: credentials.email,
        password: credentials.password,
      },
    });

    // Map snake_case DTO to camelCase domain type
    return mapLoginResponseDtoToDomain(response.data);
  }

  /**
   * Sign up with email and password
   */
  async signUp(payload: SignUpPayload): Promise<LoginResponse> {
    const response = await this.transport.request<LoginResponseDTO>({
      method: "POST",
      url: "/auth/signup",
      body: {
        email: payload.email,
        password: payload.password,
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
    });

    return mapLoginResponseDtoToDomain(response.data);
  }

  /**
   * OAuth callback after user authenticates
   */
  async handleOAuthCallback(code: string, state: string): Promise<OAuthCallbackResponse> {
    const response = await this.transport.request<OAuthCallbackResponseDTO>({
      method: "POST",
      url: "/auth/oauth/callback",
      body: { code, state },
    });

    return mapOAuthCallbackResponseDtoToDomain(response.data);
  }

  /**
   * Get current user (requires auth token)
   */
  async getCurrentUser(): Promise<AuthProfile> {
    const response = await this.transport.request<AuthProfileDTO>({
      method: "GET",
      url: "/auth/me",
    });

    return mapAuthProfileDtoToDomain(response.data);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await this.transport.request<LoginResponseDTO>({
      method: "POST",
      url: "/auth/refresh",
      body: { refresh_token: refreshToken },
    });

    return mapLoginResponseDtoToDomain(response.data);
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: "/auth/signout",
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const response = await this.transport.request<{ success: boolean }>({
      method: "POST",
      url: "/auth/verify-email",
      body: { token },
    });

    return response.data;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    const response = await this.transport.request<{ success: boolean }>({
      method: "POST",
      url: "/auth/request-password-reset",
      body: { email },
    });

    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const response = await this.transport.request<{ success: boolean }>({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, new_password: newPassword },
    });

    return response.data;
  }
}
