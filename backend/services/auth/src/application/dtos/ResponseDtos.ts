export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface SignUpResponse extends TokenResponse {
  user: UserResponse;
}

export interface SignInResponse extends TokenResponse {
  user: UserResponse;
}

export interface RefreshTokenResponse extends TokenResponse {}
