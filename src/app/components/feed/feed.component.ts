import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { FeedService } from '../../services/feed.service';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { FeedItem } from '../../models/feed.model';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { PostCardComponent } from '../post-card/post-card.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, MatTabsModule, MatBadgeModule, MatDividerModule,
            MatSnackBarModule, PostCardComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit, OnDestroy {
  private feedService = inject(FeedService);
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  posts = signal<Post[]>([]);
  userMap = signal<Record<number, User>>({});
  loading = signal(false);
  loadingMore = signal(false);
  unseenCount = signal(0);
  showUnseenBanner = signal(false);

  userId: number | null = null;
  page = 1;
  pageSize = 20;
  hasMore = signal(true);

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    if (this.userId) {
      this.loadFeed();
      this.checkUnseen();
    }
  }

  ngOnDestroy(): void {
    if (this.userId) {
      this.feedService.markAsSeen(this.userId).subscribe();
    }
  }

  checkUnseen(): void {
    this.feedService.getUnseenCount(this.userId!).subscribe(res => {
      const count = res?.unseenCount ?? 0;
      this.unseenCount.set(count);
      if (count > 0) this.showUnseenBanner.set(true);
      this.cdr.detectChanges();
    });
  }

  loadFeed(reset = true): void {
    if (reset) {
      this.page = 1;
      this.posts.set([]);
      this.hasMore.set(true);
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.feedService.getFeed(this.userId!, this.page, this.pageSize).subscribe({
      next: items => {
        if (items.length < this.pageSize) this.hasMore.set(false);
        // Enrich feedItems → Posts by fetching each post
        if (items.length === 0) {
          this.loading.set(false);
          this.loadingMore.set(false);
          this.cdr.detectChanges();
          return;
        }
        const postRequests = items.map(item =>
          this.postService.getPostById(item.postId).pipe(catchError(() => of(null)))
        );
        forkJoin(postRequests).subscribe(results => {
          const validPosts = results.filter((p): p is Post => p !== null);
          if (reset) {
            this.posts.set(validPosts);
          } else {
            this.posts.update(all => [...all, ...validPosts]);
          }
          this.resolveAuthors(validPosts);
          this.loading.set(false);
          this.loadingMore.set(false);
          this.cdr.detectChanges();
        });
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); }
    });
  }

  private resolveAuthors(posts: Post[]): void {
    const uniqueIds = [...new Set(posts.map(p => p.userId))];
    uniqueIds.forEach(id => {
      if (!this.userMap()[id]) {
        this.authService.getUserById(id).subscribe(user => {
          this.userMap.update(m => ({ ...m, [id]: user }));
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) return;
    this.page++;
    this.loadFeed(false);
  }

  refreshFeed(): void {
    if (!this.userId) return;
    this.showUnseenBanner.set(false);
    this.unseenCount.set(0);
    
    this.feedService.getUnseenFeed(this.userId).subscribe({
      next: items => {
        if (items.length === 0) return;
        
        const postRequests = items.map(item =>
          this.postService.getPostById(item.postId).pipe(catchError(() => of(null)))
        );
        
        forkJoin(postRequests).subscribe(results => {
          const validPosts = results.filter((p): p is Post => p !== null);
          this.posts.update(all => [...validPosts, ...all]);
          this.resolveAuthors(validPosts);
          this.feedService.markAsSeen(this.userId!).subscribe();
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }
}
