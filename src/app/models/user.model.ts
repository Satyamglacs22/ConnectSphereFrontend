export interface User {
  userId: number;
  userName: string;
  fullName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: Date;
}

export interface RegisterDto {
  userName: string;
  fullName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}
