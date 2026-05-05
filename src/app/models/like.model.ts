export interface Like {
  likeId: number;
  userId: number;
  targetId: number;
  targetType: string; // 'POST' | 'COMMENT'
  createdAt: Date;
}

export interface ToggleLikeResponse {
  liked: boolean;
  likeCount: number;
  message: string;
}
