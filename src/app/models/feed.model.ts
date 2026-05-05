export interface FeedItem {
  feedItemId: number;
  userId: number;
  postId: number;
  authorId: number;
  isSeen: boolean;
  createdAt: Date;
  content?: string;
  mediaUrl?: string;
  hashtags?: string;
  likeCount: number;
  commentCount: number;
}
