import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Get all notifications for a user
  getNotifications(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/api/notifications/${userId}`);
  }

  // Get only unread notifications
  getUnreadNotifications(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/api/notifications/${userId}/unread`);
  }

  // Get unread notification count
  getUnreadCount(userId: number): Observable<{ userId: number; unreadCount: number }> {
    return this.http.get<any>(`${this.apiUrl}/api/notifications/${userId}/unreadCount`);
  }

  // Mark a single notification as read
  markRead(notifId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/notifications/${notifId}/read`, {});
  }

  // Mark all notifications as read
  markAllRead(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/notifications/${userId}/readAll`, {});
  }

  // Delete a notification
  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/notifications/${id}`);
  }

  // Send a broadcast notification (bulk)
  broadcast(userIds: number[], title: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/notifications/broadcast`, { userIds, title, message });
  }
}
