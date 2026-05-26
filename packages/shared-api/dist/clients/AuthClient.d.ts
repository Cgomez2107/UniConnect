/**
 * Auth Client
 * Handles authentication and session management
 */
import type { ITransport } from "../transport/index.js";
import type { AuthProfile, LoginResponse, OAuthSignInUrlResponse, OAuthCallbackResponse } from "@uniconnect/shared-types";
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
export declare class AuthClient {
    private transport;
    constructor(transport: ITransport);
    /**
     * Get OAuth Sign In URL
     */
    getOAuthSignInUrl(redirectTo: string): Promise<OAuthSignInUrlResponse>;
    /**
     * Sign in with email and password
     */
    signIn(credentials: SignInCredentials): Promise<LoginResponse>;
    /**
     * Sign up with email and password
     */
    signUp(payload: SignUpPayload): Promise<LoginResponse>;
    /**
     * OAuth callback after user authenticates
     */
    handleOAuthCallback(code: string, state: string): Promise<OAuthCallbackResponse>;
    /**
     * Get current user (requires auth token)
     */
    getCurrentUser(): Promise<AuthProfile>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<LoginResponse>;
    /**
     * Sign out
     */
    signOut(): Promise<void>;
    /**
     * Verify email
     */
    verifyEmail(token: string): Promise<{
        success: boolean;
    }>;
    /**
     * Request password reset
     */
    requestPasswordReset(email: string): Promise<{
        success: boolean;
    }>;
    /**
     * Reset password with token
     */
    resetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=AuthClient.d.ts.map