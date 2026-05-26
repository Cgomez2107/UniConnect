/**
 * Auth Client
 * Handles authentication and session management
 */
import { mapAuthProfileDtoToDomain, mapLoginResponseDtoToDomain, mapOAuthCallbackResponseDtoToDomain, } from "../mappers/index.js";
/**
 * Auth Client for authentication operations
 */
export class AuthClient {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    /**
     * Get OAuth Sign In URL
     */
    async getOAuthSignInUrl(redirectTo) {
        const response = await this.transport.request({
            method: "GET",
            url: "/auth/oauth/signin-url",
            params: { redirectTo },
        });
        // Map DTO to domain (though this response doesn't have snake_case fields typically)
        return response.data;
    }
    /**
     * Sign in with email and password
     */
    async signIn(credentials) {
        const response = await this.transport.request({
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
    async signUp(payload) {
        const response = await this.transport.request({
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
    async handleOAuthCallback(code, state) {
        const response = await this.transport.request({
            method: "POST",
            url: "/auth/oauth/callback",
            body: { code, state },
        });
        return mapOAuthCallbackResponseDtoToDomain(response.data);
    }
    /**
     * Get current user (requires auth token)
     */
    async getCurrentUser() {
        const response = await this.transport.request({
            method: "GET",
            url: "/auth/me",
        });
        return mapAuthProfileDtoToDomain(response.data);
    }
    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        const response = await this.transport.request({
            method: "POST",
            url: "/auth/refresh",
            body: { refresh_token: refreshToken },
        });
        return mapLoginResponseDtoToDomain(response.data);
    }
    /**
     * Sign out
     */
    async signOut() {
        await this.transport.request({
            method: "POST",
            url: "/auth/signout",
        });
    }
    /**
     * Verify email
     */
    async verifyEmail(token) {
        const response = await this.transport.request({
            method: "POST",
            url: "/auth/verify-email",
            body: { token },
        });
        return response.data;
    }
    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        const response = await this.transport.request({
            method: "POST",
            url: "/auth/request-password-reset",
            body: { email },
        });
        return response.data;
    }
    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        const response = await this.transport.request({
            method: "POST",
            url: "/auth/reset-password",
            body: { token, new_password: newPassword },
        });
        return response.data;
    }
}
//# sourceMappingURL=AuthClient.js.map