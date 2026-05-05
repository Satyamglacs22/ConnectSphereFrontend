import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-follow-list-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>people</mat-icon> {{ data.title }}
      <span class="count">{{ data.users.length }}</span>
    </h2>
    <mat-dialog-content>
      @if (data.users.length === 0) {
        <div class="empty">
          <mat-icon>person_off</mat-icon>
          <p>No users yet.</p>
        </div>
      }
      <div class="user-list">
        @for (user of data.users; track user.userId) {
          <div class="user-row" [routerLink]="['/profile', user.userId]" (click)="close()">
            <div class="user-avatar">
              @if (user.avatarUrl) {
                <img [src]="user.avatarUrl" [alt]="user.fullName" />
              } @else {
                {{ user.fullName?.charAt(0) || 'U' }}
              }
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.fullName }}</div>
              <div class="user-handle">&#64;{{ user.userName }}</div>
            </div>
            <mat-icon class="chevron">chevron_right</mat-icon>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex; align-items: center; gap: 12px;
      color: #1e293b !important; font-size: 20px !important; font-weight: 800 !important;
      mat-icon { color: var(--prism-primary); font-size: 24px; width: 24px; height: 24px; }
      .count {
        margin-left: auto; font-size: 12px;
        background: var(--prism-primary-gradient); border-radius: 12px;
        padding: 4px 12px; color: white; font-weight: 800;
        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
      }
    }

    .empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 60px 0; color: var(--prism-text-muted);
      mat-icon { font-size: 60px; width: 60px; height: 60px; margin-bottom: 16px; opacity: 0.3; }
      p { font-weight: 600; }
    }

    .user-list { display: flex; flex-direction: column; gap: 8px; min-width: 360px; padding: 12px 0; }

    .user-row {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 16px; border-radius: 20px; cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
      &:hover { 
        background: rgba(255,255,255,0.05); 
        border-color: var(--prism-border);
        transform: translateX(4px);
      }
    }

    .user-avatar {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      background: var(--prism-primary-gradient);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 800; color: white;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .user-info { flex: 1; overflow: hidden;
      .user-name { font-weight: 800; color: #1e293b; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .user-handle { color: #64748b; font-size: 13px; font-weight: 600; }
    }

    .chevron { color: #94a3b8; font-size: 20px; }
  `]
})
export class FollowListDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { title: string; users: User[] };
  private dialogRef = inject(MatDialogRef<FollowListDialogComponent>);

  close(): void { this.dialogRef.close(); }
}
