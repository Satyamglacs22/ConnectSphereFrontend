import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Like, ToggleLikeResponse } from '../models/like.model';

@Injectable({ providedIn: 'root' })
export class LikeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Toggle like on a POST or COMMENT
  toggleLike(userId: number, targetId: number, targetType: string = 'POST'): Observable<ToggleLikeResponse> {
    return this.http.post<ToggleLikeResponse>(`${this.apiUrl}/api/likes/toggle`, { userId, targetId, targetType });
  }

  // Check if a user has liked a specific target
  hasLiked(userId: number, targetId: number, targetType: string = 'POST'): Observable<{ userId: number; targetId: number; type: string; hasLiked: boolean }> {
    return this.http.get<any>(
      `${this.apiUrl}/api/likes/hasLiked/${userId}/${targetId}/${targetType}`
    );
  }

  // Get like count for a post or comment
  getLikeCount(targetId: number, targetType: string = 'POST'): Observable<{ targetId: number; type: string; likeCount: number }> {
    return this.http.get<any>(`${this.apiUrl}/api/likes/count/${targetId}/${targetType}`);
  }

  // Get all likes for a specific target (post or comment)
  getLikesByTarget(targetId: number, targetType: string = 'POST'): Observable<Like[]> {
    return this.http.get<Like[]>(`${this.apiUrl}/api/likes/target/${targetId}/${targetType}`);
  }

  // Get all likes made by a user (any target type)
  getLikesByUser(userId: number): Observable<Like[]> {
    return this.http.get<Like[]>(`${this.apiUrl}/api/likes/user/${userId}`);
  }

  // Get user IDs who liked a specific target
  getLikersForTarget(targetId: number, targetType: string = 'POST'): Observable<{ targetId: number; type: string; likerIds: number[] }> {
    return this.http.get<any>(`${this.apiUrl}/api/likes/target/${targetId}/${targetType}/likers`);
  }

  // Get IDs of posts liked by a user
  getLikedPostsByUser(userId: number): Observable<{ userId: number; likedPostIds: number[] }> {
    return this.http.get<any>(`${this.apiUrl}/api/likes/user/${userId}/posts`);
  }
}
