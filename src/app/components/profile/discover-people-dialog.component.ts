import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { User } from '../../models/user.model';
import { FollowService } from '../../services/follow.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-discover-people-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatSnackBarModule, RouterLink],
  template: `
    <div class="discover-container">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>explore</mat-icon> Discover People
        <button mat-icon-button (click)="close()" class="close-btn"><mat-icon>close</mat-icon></button>
      </h2>
      
      <mat-dialog-content>
        <p class="subtitle">Suggested for you based on mutual connections</p>
        
        @if (loading()) {
          <div class="loading-state">
            <mat-icon class="spin">sync</mat-icon>
            <p>Finding people you might know...</p>
          </div>
        } @else if (suggestions().length === 0) {
          <div class="empty">
            <mat-icon>group_add</mat-icon>
            <p>No new suggestions at the moment.</p>
          </div>
        } @else {
          <div class="user-list">
            @for (sug of suggestions(); track sug.userId) {
              <div class="user-card">
                <div class="user-main" [routerLink]="['/profile', sug.userId]" (click)="close()">
                  <div class="user-avatar">
                    @if (sug.avatarUrl) {
                      <img [src]="sug.avatarUrl" [alt]="sug.fullName" />
                    } @else {
                      {{ sug.fullName[0] }}
                    }
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ sug.fullName }}</div>
                    <div class="user-handle">&#64;{{ sug.userName }}</div>
                    @if (sug.mutualCount > 0) {
                      <div class="mutual-text">{{ sug.mutualCount }} mutual followers</div>
                    }
                  </div>
                </div>
                
                <button mat-flat-button class="follow-btn" 
                        [class.following]="isFollowing(sug.userId)"
                        (click)="toggleFollow(sug)">
                  {{ isFollowing(sug.userId) ? 'Following' : 'Follow' }}
                </button>
              </div>
            }
          </div>
        }
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .discover-container { min-width: 450px; border-radius: 28px; overflow: hidden; }
    
    .dialog-title {
      display: flex; align-items: center; gap: 12px; padding: 24px 24px 12px !important;
      color: #0f172a !important; font-size: 24px !important; font-weight: 800 !important;
      mat-icon { color: var(--prism-primary); font-size: 28px; width: 28px; height: 28px; }
      .close-btn { margin-left: auto; color: #64748b; }
    }

    .subtitle { color: #64748b; padding: 0 24px; margin-bottom: 24px; font-weight: 600; font-size: 14px; }

    .loading-state, .empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px 0; color: #64748b;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3; }
      .spin { animation: spin 2s linear infinite; opacity: 0.8; color: var(--prism-primary); }
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .user-list { display: flex; flex-direction: column; gap: 12px; padding: 0 12px 24px; }

    .user-card {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 16px; border-radius: 20px;
      background: #f8fafc; transition: all 0.3s;
      &:hover { background: #f1f5f9; transform: scale(1.01); }
      
      .user-main { 
        display: flex; align-items: center; gap: 16px; flex: 1; cursor: pointer;
        overflow: hidden;
      }
    }

    .user-avatar {
      width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
      background: var(--prism-primary-gradient);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 800; color: white;
      overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .user-info {
      flex: 1; overflow: hidden;
      .user-name { font-weight: 800; color: #0f172a; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .user-handle { color: #64748b; font-size: 14px; font-weight: 600; }
      .mutual-text { font-size: 12px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
    }

    .follow-btn {
      border-radius: 12px; font-weight: 800; font-size: 13px; height: 36px; padding: 0 16px;
      background: var(--prism-primary-gradient) !important; color: white !important;
      &.following { background: #e2e8f0 !important; color: #475569 !important; box-shadow: none; }
    }
  `]
})
export class DiscoverPeopleDialogComponent implements OnInit {
  private followService = inject(FollowService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DiscoverPeopleDialogComponent>);

  suggestions = signal<any[]>([]);
  followingIds = signal<Set<number>>(new Set());
  loading = signal(true);

  ngOnInit(): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) return;

    this.followService.getSuggestions(10).subscribe({
      next: (res: any[]) => {
        this.suggestions.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isFollowing(userId: number): boolean {
    return this.followingIds().has(userId);
  }

  toggleFollow(user: any): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) return;

    if (this.isFollowing(user.userId)) {
      this.followService.unfollowUser(user.userId).subscribe(() => {
        this.followingIds.update(ids => { ids.delete(user.userId); return new Set(ids); });
      });
    } else {
      this.followService.followUser(currentUserId, user.userId).subscribe(() => {
        this.followingIds.update(ids => { ids.add(user.userId); return new Set(ids); });
        this.snackBar.open(`Now following ${user.userName}!`, 'Close', { duration: 2000 });
      });
    }
  }

  close(): void { this.dialogRef.close(); }
}
