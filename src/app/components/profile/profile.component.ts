import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { FollowService } from '../../services/follow.service';
import { LikeService } from '../../services/like.service';
import { CommentService } from '../../services/comment.service';
import { User } from '../../models/user.model';
import { Post } from '../../models/post.model';
import { MutualFollowers } from '../../models/follow.model';
import { PostCardComponent } from '../post-card/post-card.component';
import { FollowListDialogComponent } from './follow-list-dialog.component';
import { DiscoverPeopleDialogComponent } from './discover-people-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatDialogModule,
    MatTooltipModule, MatSnackBarModule, MatTabsModule, PostCardComponent,
    FollowListDialogComponent, DiscoverPeopleDialogComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private followService = inject(FollowService);
  private likeService = inject(LikeService);
  private commentService = inject(CommentService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  profileUser = signal<User | null>(null);
  posts = signal<Post[]>([]);
  likedPosts = signal<Post[]>([]);
  userComments = signal<any[]>([]);
  loadingLiked = signal(false);
  loadingComments = signal(false);
  followStatus = signal<string>('NONE');
  isBlocked = signal(false);
  loading = signal(true);
  pendingRequests = signal<any[]>([]);
  pendingCount = signal(0);
  showPending = false;

  // Mutual followers (when viewing another profile)
  mutualFollowers = signal<MutualFollowers | null>(null);
  mutualUsers = signal<User[]>([]);

  currentUserId: number | null = null;
  profileUserId: number | null = null;
  isOwnProfile = false;
  activeTab = signal<'posts' | 'liked' | 'comments'>('posts');

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.route.params.subscribe(params => {
      this.profileUserId = parseInt(params['id']);
      this.isOwnProfile = this.currentUserId === this.profileUserId;
      this.profileUser.set(null);
      this.posts.set([]);
      this.likedPosts.set([]);
      this.followStatus.set('NONE');
      this.loading.set(true);
      this.showPending = false;
      this.mutualFollowers.set(null);
      this.mutualUsers.set([]);
      this.activeTab.set('posts');
      this.loadProfile();
    });
  }

  loadProfile(): void {
    if (!this.profileUserId) return;

    // Load user info
    this.authService.getUserById(this.profileUserId).subscribe({
      next: user => { this.profileUser.set(user); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    // Load posts
    this.postService.getPostsByUser(this.profileUserId, 1, 10).subscribe({
      next: posts => {
        this.posts.set(posts);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });

    // Follow status + mutual followers (when viewing another user)
    if (!this.isOwnProfile && this.currentUserId) {
      this.followService.getFollowStatus(this.currentUserId, this.profileUserId!).subscribe({
        next: (res: any) => this.followStatus.set(res.status ?? 'NONE')
      });

      // Mutual followers widget
      this.followService.getMutualFollowers(this.currentUserId, this.profileUserId!).subscribe({
        next: (mutual: MutualFollowers) => {
          this.mutualFollowers.set(mutual);
          if (mutual.mutualFollowerIds?.length > 0) {
            const slice = mutual.mutualFollowerIds.slice(0, 3); // show up to 3 avatars
            forkJoin(slice.map((id: number) => this.authService.getUserById(id))).subscribe({
              next: (users: User[]) => this.mutualUsers.set(users),
              error: () => {}
            });
          }
        },
        error: () => {}
      });

      // Block status
      this.followService.isBlocked(this.profileUserId!).subscribe(res => {
        this.isBlocked.set(res.isBlocked);
      });
    }

    // Pending follow requests for own profile
    if (this.isOwnProfile) {
      this.followService.getPendingRequests(this.profileUserId!).subscribe({
        next: reqs => {
          this.pendingCount.set(reqs.length);
          if (reqs.length > 0) {
            forkJoin(reqs.map(r => this.authService.getUserById(r.followerId))).subscribe({
              next: users => {
                const enriched = reqs.map((r, i) => ({
                  ...r,
                  followerName: users[i]?.fullName,
                  followerUserName: users[i]?.userName
                }));
                this.pendingRequests.set(enriched);
              },
              error: () => this.pendingRequests.set(reqs)
            });
          } else {
            this.pendingRequests.set([]);
          }
        }
      });
    }
  }

  // ── Liked Posts tab ─────────────────────────────────────
  loadLikedPosts(): void {
    if (!this.profileUserId || this.likedPosts().length > 0) return;
    this.loadingLiked.set(true);
    this.likeService.getLikedPostsByUser(this.profileUserId).subscribe({
      next: res => {
        const ids = res.likedPostIds ?? [];
        if (ids.length === 0) { this.loadingLiked.set(false); return; }
        forkJoin(ids.map(id => this.postService.getPostById(id))).subscribe({
          next: posts => { this.likedPosts.set(posts); this.loadingLiked.set(false); },
          error: () => this.loadingLiked.set(false)
        });
      },
      error: () => this.loadingLiked.set(false)
    });
  }

  // ── Comments tab ────────────────────────────────────────
  loadUserComments(): void {
    if (!this.profileUserId || this.userComments().length > 0) return;
    this.loadingComments.set(true);
    this.commentService.getCommentsByUser(this.profileUserId).subscribe({
      next: comments => {
        this.userComments.set(comments);
        this.loadingComments.set(false);
        this.cdr.detectChanges();
      },
      error: () => this.loadingComments.set(false)
    });
  }



  switchTab(tab: 'posts' | 'liked' | 'comments'): void {
    this.activeTab.set(tab);
    if (tab === 'liked') this.loadLikedPosts();
    if (tab === 'comments') this.loadUserComments();
  }

  toggleFollow(): void {
    if (!this.currentUserId || !this.profileUserId) return;
    const currentStatus = this.followStatus();
    if (currentStatus === 'ACCEPTED' || currentStatus === 'PENDING') {
      this.followService.unfollowUser(this.profileUserId).subscribe(() => {
        this.followStatus.set('NONE');
        this.snackBar.open(currentStatus === 'PENDING' ? 'Follow request canceled.' : 'Unfollowed.', 'Close', { duration: 2000 });
      });
    } else {
      this.followService.followUser(this.currentUserId, this.profileUserId).subscribe((res: any) => {
        const status = res.status;
        this.followStatus.set(status);
        this.snackBar.open(status === 'PENDING' ? 'Follow request sent!' : 'Now following!', 'Close', { duration: 2000 });
      });
    }
  }

  toggleBlock(): void {
    if (!this.profileUserId) return;
    if (this.isBlocked()) {
      this.followService.unblockUser(this.profileUserId).subscribe(() => {
        this.isBlocked.set(false);
        this.snackBar.open('User unblocked.', 'Close', { duration: 2000 });
      });
    } else {
      if (!confirm('Block this user? They will not be able to follow you or see your posts.')) return;
      this.followService.blockUser(this.profileUserId).subscribe(() => {
        this.isBlocked.set(true);
        this.followStatus.set('NONE');
        this.snackBar.open('User blocked.', 'Close', { duration: 2000 });
      });
    }
  }

  acceptRequest(followId: number): void {
    this.followService.acceptRequest(followId).subscribe(() => {
      this.pendingRequests.update(reqs => reqs.filter(r => r.followId !== followId));
      this.pendingCount.update(c => c - 1);
      this.snackBar.open('Follow request accepted.', 'Close', { duration: 2000 });
    });
  }

  rejectRequest(followId: number): void {
    this.followService.rejectRequest(followId).subscribe(() => {
      this.pendingRequests.update(reqs => reqs.filter(r => r.followId !== followId));
      this.pendingCount.update(c => c - 1);
      this.snackBar.open('Request rejected.', 'Close', { duration: 2000 });
    });
  }

  // ── Follower/Following dialogs ──────────────────────────
  openFollowers(): void {
    if (!this.profileUserId) return;
    this.followService.getFollowers(this.profileUserId).subscribe(entities => {
      const ids: number[] = (entities as any[]).map(e => e.followerId ?? e.FollowerId);
      this.resolveUsers(ids, 'Followers');
    });
  }

  openFollowing(): void {
    if (!this.profileUserId) return;
    this.followService.getFollowing(this.profileUserId).subscribe(entities => {
      const ids: number[] = (entities as any[]).map(e => e.followeeId ?? e.FolloweeId);
      this.resolveUsers(ids, 'Following');
    });
  }

  // ── Discover People ─────────────────────────────────────
  openDiscoverPeople(): void {
    this.dialog.open(DiscoverPeopleDialogComponent, {
      width: '500px',
      panelClass: 'glass-dialog'
    });
  }

  private resolveUsers(ids: number[], title: string): void {
    if (ids.length === 0) {
      this.dialog.open(FollowListDialogComponent, {
        width: '400px', panelClass: 'glass-dialog',
        data: { title, users: [] }
      });
      return;
    }
    forkJoin(ids.map(id => this.authService.getUserById(id))).subscribe({
      next: users => {
        this.dialog.open(FollowListDialogComponent, {
          width: '400px', panelClass: 'glass-dialog',
          data: { title, users }
        });
      },
      error: () => {
        this.dialog.open(FollowListDialogComponent, {
          width: '400px', panelClass: 'glass-dialog',
          data: { title, users: ids.map(id => ({ userId: id, fullName: 'User ' + id, userName: String(id) })) }
        });
      }
    });
  }
}
