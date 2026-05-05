import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FollowEntity, FollowResponseDto, MutualFollowers, FollowSuggestion } from '../models/follow.model';

@Injectable({ providedIn: 'root' })
export class FollowService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Follow a user
  followUser(followerId: number, followeeId: number): Observable<FollowResponseDto> {
    return this.http.post<FollowResponseDto>(`${this.apiUrl}/api/follows`, { followerId, followeeId });
  }

  // Unfollow a user
  unfollowUser(followeeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/follows/${followeeId}`);
  }

  // Accept a follow request
  acceptRequest(followId: number): Observable<FollowResponseDto> {
    return this.http.put<FollowResponseDto>(`${this.apiUrl}/api/follows/${followId}/accept`, {});
  }

  // Reject a follow request
  rejectRequest(followId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/follows/${followId}/reject`, {});
  }

  // Get all followers of a user
  getFollowers(userId: number): Observable<FollowEntity[]> {
    return this.http.get<FollowEntity[]>(`${this.apiUrl}/api/follows/${userId}/followers`);
  }

  // Get all users that a user is following
  getFollowing(userId: number): Observable<FollowEntity[]> {
    return this.http.get<FollowEntity[]>(`${this.apiUrl}/api/follows/${userId}/following`);
  }

  // Get pending follow requests for a user
  getPendingRequests(userId: number): Observable<FollowEntity[]> {
    return this.http.get<FollowEntity[]>(`${this.apiUrl}/api/follows/${userId}/pending`);
  }

  // Check if followerId is following followeeId
  isFollowing(followerId: number, followeeId: number): Observable<{ followerId: number; followeeId: number; isFollowing: boolean }> {
    return this.http.get<any>(
      `${this.apiUrl}/api/follows/isFollowing/${followerId}/${followeeId}`
    );
  }

  // Get full follow relationship status: NONE | PENDING | ACCEPTED
  getFollowStatus(followerId: number, followeeId: number): Observable<{ followerId: number; followeeId: number; status: string }> {
    return this.http.get<any>(
      `${this.apiUrl}/api/follows/status/${followerId}/${followeeId}`
    );
  }

  // Get mutual followers between two users
  getMutualFollowers(userAId: number, userBId: number): Observable<MutualFollowers> {
    return this.http.get<MutualFollowers>(`${this.apiUrl}/api/follows/mutual/${userAId}/${userBId}`);
  }

  // Get IDs of all followers
  getFollowerIds(userId: number): Observable<{ userId: number; followerIds: number[] }> {
    return this.http.get<any>(`${this.apiUrl}/api/follows/${userId}/followerIds`);
  }

  // Get IDs of all users this user follows
  getFollowingIds(userId: number): Observable<{ userId: number; followingIds: number[] }> {
    return this.http.get<any>(`${this.apiUrl}/api/follows/${userId}/followingIds`);
  }

  // ── Blocks ──────────────────────────────────
  blockUser(blockedId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/follows/block/${blockedId}`, {});
  }

  unblockUser(blockedId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/follows/block/${blockedId}`);
  }

  isBlocked(userId: number): Observable<{ userId: number; isBlocked: boolean }> {
    return this.http.get<any>(`${this.apiUrl}/api/follows/isBlocked/${userId}`);
  }

  getBlockedUsers(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/api/follows/blocked`);
  }

  getSuggestions(count: number = 5): Observable<FollowSuggestion[]> {
    return this.http.get<FollowSuggestion[]>(`${this.apiUrl}/api/follows/suggestions?count=${count}`);
  }
}
