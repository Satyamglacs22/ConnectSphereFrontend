export interface Comment {
  commentId: number;
  postId: number;
  userId: number;
  parentCommentId?: number;
  content: string;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: Date;
  editedAt?: Date;
  authorName: string;
  authorAvatarUrl: string;
}

export interface AddCommentDto {
  postId: number;
  userId: number;
  content: string;
  parentCommentId?: number;
}
