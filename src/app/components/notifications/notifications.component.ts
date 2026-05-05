import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { FollowService } from '../../services/follow.service';
import { AppNotification } from '../../models/notification.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

type FilterTab = 'all' | 'unread';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatTooltipModule, 
    TimeAgoPipe, 
    MatSnackBarModule,
    MatCardModule
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private authService = inject(AuthService);
  private followService = inject(FollowService);
  private snackBar = inject(MatSnackBar);

  notifications = signal<AppNotification[]>([]);
  loading = signal(true);
  activeTab = signal<FilterTab>('all');
  
  // Broadcast/Announcement state
  showBroadcastForm = signal(false);
  broadcastTitle = '';
  broadcastMessage = '';
  sendingBroadcast = signal(false);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  userId: number | null = null;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    if (this.userId) this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    const obs = this.activeTab() === 'unread' 
      ? this.notifService.getUnreadNotifications(this.userId!)
      : this.notifService.getNotifications(this.userId!);

    obs.subscribe({
      next: n => { this.notifications.set(n); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  setTab(tab: FilterTab): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.loadNotifications();
  }

  markAllRead(): void {
    this.notifService.markAllRead(this.userId!).subscribe(() =>
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })))
    );
  }

  markRead(notif: AppNotification): void {
    if (notif.isRead) return;
    this.notifService.markRead(notif.notificationId).subscribe(() =>
      this.notifications.update(list =>
        list.map(n => n.notificationId === notif.notificationId ? { ...n, isRead: true } : n)
      )
    );
  }

  deleteNotif(event: Event, notifId: number): void {
    event.stopPropagation();
    this.notifService.deleteNotification(notifId).subscribe(() =>
      this.notifications.update(list => list.filter(n => n.notificationId !== notifId))
    );
  }

  acceptFollowRequest(event: Event, notif: AppNotification): void {
    event.stopPropagation();
    this.followService.acceptRequest(notif.targetId).subscribe({
      next: () => {
        this.snackBar.open('Follow request accepted.', 'Close', { duration: 2000 });
        this.markRead(notif);
        this.notifications.update(list => list.map(n => 
          n.notificationId === notif.notificationId ? { ...n, message: 'Accepted follow request.', type: 'FOLLOW_ACCEPTED' } : n
        ));
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to accept request.', 'Close', { duration: 3000 });
      }
    });
  }

  rejectFollowRequest(event: Event, notif: AppNotification): void {
    event.stopPropagation();
    this.followService.rejectRequest(notif.targetId).subscribe({
      next: () => {
        this.snackBar.open('Follow request rejected.', 'Close', { duration: 2000 });
        this.deleteNotif(event, notif.notificationId);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to reject request.', 'Close', { duration: 3000 });
      }
    });
  }

  sendAnnouncement(): void {
    if (!this.broadcastTitle.trim() || !this.broadcastMessage.trim() || !this.userId) return;
    this.sendingBroadcast.set(true);

    this.followService.getFollowerIds(this.userId).subscribe({
      next: res => {
        const ids = res.followerIds || [];
        if (ids.length === 0) {
          this.snackBar.open('You have no followers to broadcast to!', 'Close', { duration: 3000 });
          this.sendingBroadcast.set(false);
          return;
        }

        this.notifService.broadcast(ids, this.broadcastTitle, this.broadcastMessage).subscribe({
          next: () => {
            this.snackBar.open('Announcement sent to all followers! 📢', 'Close', { duration: 3000 });
            this.broadcastTitle = '';
            this.broadcastMessage = '';
            this.showBroadcastForm.set(false);
            this.sendingBroadcast.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.snackBar.open('Failed to send broadcast.', 'Close', { duration: 3000 });
            this.sendingBroadcast.set(false);
          }
        });
      },
      error: () => {
        this.snackBar.open('Error fetching followers.', 'Close', { duration: 3000 });
        this.sendingBroadcast.set(false);
      }
    });
  }

  iconForType(type: string): string {
    const map: Record<string, string> = {
      'LIKE_POST':       'favorite',
      'LIKE_COMMENT':    'favorite',
      'NEW_COMMENT':     'chat_bubble',
      'NEW_REPLY':       'reply',
      'NEW_FOLLOWER':    'person_add',
      'MENTION':         'alternate_email',
      'FOLLOW_REQUEST':  'person_add_alt',
      'FOLLOW_ACCEPTED': 'how_to_reg'
    };
    return map[type] ?? 'notifications';
  }
}
