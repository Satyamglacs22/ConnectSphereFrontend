export interface FollowEntity {
  followId: number;
  followerId: number;
  followeeId: number;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: Date;
}

export interface FollowResponseDto {
  followId: number;
  followerId: number;
  followeeId: number;
  status: string;
}

export interface MutualFollowers {
  userAId: number;
  userBId: number;
  mutualFollowerIds: number[];
  mutualCount: number;
}

export interface FollowSuggestion {
  suggestedUserId: number;
  mutualFriendIds: number[];
  mutualCount: number;
}
