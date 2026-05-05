import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { PostCardComponent } from '../post-card/post-card.component';
import { CreatePostDialogComponent } from './create-post-dialog.component';
import { SuggestionsComponent } from '../suggestions/suggestions.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatDialogModule, MatProgressSpinnerModule, PostCardComponent,
    SuggestionsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  posts: Post[] = [];
  trendingPosts: Post[] = [];
  userMap: Record<number, User> = {};
  currentUser: User | null = null;
  loading = false;
  activeTab: 'public' | 'trending' = 'public';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => { this.currentUser = u; this.cdr.detectChanges(); });
    this.loadPublicPosts();
    this.loadTrending();
  }

  loadPublicPosts(): void {
    this.loading = true;
    this.postService.getPublicPosts().subscribe({
      next: posts => {
        this.posts = posts;
        this.loading = false;
        this.resolveAuthors(posts);
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  loadTrending(): void {
    this.postService.getTrendingPosts(5).subscribe({
      next: p => {
        this.trendingPosts = p;
        this.resolveAuthors(p);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private resolveAuthors(posts: Post[]): void {
    const uniqueIds = [...new Set(posts.map(p => p.userId))];
    uniqueIds.forEach(id => {
      if (!this.userMap[id]) {
        this.authService.getUserById(id).subscribe(user => {
          this.userMap[id] = user;
          this.cdr.detectChanges();
        });
      }
    });
  }

  setTab(tab: 'public' | 'trending'): void {
    this.activeTab = tab;
    if (tab === 'public') this.loadPublicPosts();
    else this.loadTrending();
  }

  openCreatePost(): void {
    const ref = this.dialog.open(CreatePostDialogComponent, {
      width: '560px',
      maxWidth: '96vw',
      panelClass: 'glass-dialog'
    });
    ref.afterClosed().subscribe((newPost: Post | undefined) => {
      if (newPost) {
        this.posts.unshift(newPost);
        this.cdr.detectChanges();
      }
    });
  }
  get firstName(): string {
    return this.currentUser?.fullName?.split(' ')[0] || 'Explorer';
  }
}
