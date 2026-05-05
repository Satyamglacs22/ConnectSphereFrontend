export interface AppNotification {
  notificationId: number;
  recipientId: number;
  actorId: number;
  type: string;
  message: string;
  targetId: number;
  targetType: string;
  isRead: boolean;
  createdAt: Date;
  actorName?: string;
  actorAvatarUrl?: string;
}
