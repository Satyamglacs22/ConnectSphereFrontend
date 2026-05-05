export interface Post {
  postId: number;
  userId: number;
  content: string;
  mediaUrl?: string;
  mediaList?: string[];
  mediaType?: string;
  visibility: string;
  hashtags?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreatePostDto {
  userId: number;
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaType?: string;
  visibility: string;
  hashtags?: string;
}
