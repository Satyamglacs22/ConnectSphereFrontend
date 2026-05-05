import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-likers-dialog',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="likers-dialog">
      <h2 mat-dialog-title>
        <mat-icon>favorite</mat-icon>
        {{ data.title }}
      </h2>
      <mat-dialog-content>
        @if (loading) {
          <div class="center"><mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner></div>
        }
        @for (user of users; track user.userId) {
          <div class="liker-row" [routerLink]="['/profile', user.userId]" (click)="close()">
            <div class="liker-avatar">{{ user.fullName[0] }}</div>
            <div>
              <div class="liker-name">{{ user.fullName }}</div>
              <div class="liker-handle">&#64;{{ user.userName }}</div>
            </div>
          </div>
        }
        @if (!loading && users.length === 0) {
          <p class="empty">No likes yet.</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .likers-dialog { padding: 8px; }
    h2 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; margin-bottom: 8px; }
    .center { display: flex; justify-content: center; padding: 24px; }
    .liker-row { display: flex; align-items: center; gap: 12px; padding: 10px 4px; cursor: pointer; border-radius: 8px; transition: background .2s; }
    .liker-row:hover { background: rgba(255,255,255,.06); }
    .liker-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6c63ff, #ff6584); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; flex-shrink: 0; }
    .liker-name { font-weight: 600; font-size: .9rem; }
    .liker-handle { font-size: .8rem; opacity: .6; }
    .empty { text-align: center; opacity: .5; padding: 24px 0; }
  `]
})
export class LikersDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<LikersDialogComponent>);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  data: { ids: number[]; title: string } = inject(MAT_DIALOG_DATA);

  users: User[] = [];
  loading = true;

  ngOnInit(): void {
    if (!this.data.ids || this.data.ids.length === 0) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    forkJoin(this.data.ids.map(id => this.authService.getUserById(id))).subscribe({
      next: u => {
        this.users = u;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  close() { this.dialogRef.close(); }
}
