import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Bookmark {
  bookmarkId: number;
  userId: number;
  postId: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  toggleBookmark(postId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/bookmarks/toggle/${postId}`, {});
  }

  getUserBookmarks(): Observable<Bookmark[]> {
    return this.http.get<Bookmark[]>(`${this.apiUrl}/api/bookmarks`);
  }

  isBookmarked(postId: number): Observable<{ postId: number, bookmarked: boolean }> {
    return this.http.get<{ postId: number, bookmarked: boolean }>(`${this.apiUrl}/api/bookmarks/check/${postId}`);
  }
}
