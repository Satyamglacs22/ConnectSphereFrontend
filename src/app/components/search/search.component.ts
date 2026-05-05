import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { FollowService } from '../../services/follow.service';
import { User } from '../../models/user.model';
import { Post } from '../../models/post.model';
import { PostCardComponent } from '../post-card/post-card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatTabsModule, MatListModule, MatProgressSpinnerModule,
    MatChipsModule, PostCardComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private followService = inject(FollowService);
  private cdr = inject(ChangeDetectorRef);

  query = '';
  users: User[] = [];
  posts: Post[] = [];
  loading = false;
  currentUserId: number | null = null;
  followStatusMap: Record<number, string> = {};

  constructor() {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  search(): void {
    if (!this.query.trim()) return;
    this.loading = true;
    this.users = [];
    this.posts = [];

    this.authService.searchUsers(this.query).subscribe({
      next: users => {
        this.users = users;
        users.forEach(u => {
          if (this.currentUserId && u.userId !== this.currentUserId) {
            this.followService.getFollowStatus(this.currentUserId, u.userId).subscribe((res: any) => {
              this.followStatusMap[u.userId] = res.status ?? 'NONE';
              this.cdr.detectChanges();
            });
          }
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });

    this.postService.searchPosts(this.query).subscribe({
      next: posts => { this.posts = posts; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  toggleFollow(user: User): void {
    if (!this.currentUserId) return;
    const status = this.followStatusMap[user.userId] || 'NONE';

    if (status === 'ACCEPTED' || status === 'PENDING') {
      this.followService.unfollowUser(user.userId).subscribe(() => {
        this.followStatusMap[user.userId] = 'NONE';
        this.cdr.detectChanges();
      });
    } else {
      this.followService.followUser(this.currentUserId, user.userId).subscribe((res: any) => {
        this.followStatusMap[user.userId] = res.status ?? (user.isPrivate ? 'PENDING' : 'ACCEPTED');
        this.cdr.detectChanges();
      });
    }
  }

  isOwnProfile(userId: number): boolean {
    return this.currentUserId === userId;
  }
}
