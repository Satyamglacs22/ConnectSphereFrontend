import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FeedItem } from '../models/feed.model';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Get paginated feed for a user
  getFeed(userId: number, page: number = 1, pageSize: number = 20): Observable<FeedItem[]> {
    return this.http.get<FeedItem[]>(
      `${this.apiUrl}/api/feed/${userId}?page=${page}&pageSize=${pageSize}`
    );
  }

  // Get unseen feed items (new posts since last visit)
  getUnseenFeed(userId: number): Observable<FeedItem[]> {
    return this.http.get<FeedItem[]>(`${this.apiUrl}/api/feed/${userId}/unseen`);
  }

  // Get count of unseen feed items
  getUnseenCount(userId: number): Observable<{ userId: number; unseenCount: number }> {
    return this.http.get<any>(`${this.apiUrl}/api/feed/${userId}/unseenCount`);
  }

  // Mark all feed items as seen
  markAsSeen(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/feed/${userId}/markSeen`, {});
  }
}
