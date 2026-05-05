import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';
import { PostCardComponent } from '../post-card/post-card.component';
import { AuthService } from '../../services/auth.service';
import { FollowService } from '../../services/follow.service';
import { User } from '../../models/user.model';
import { forkJoin } from 'rxjs';

const POPULAR_TAGS = ['angular', 'typescript', 'webdev', 'coding', 'tech', 'javascript', 'css', 'design', 'ux', 'career'];

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, PostCardComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss'
})
export class ExploreComponent implements OnInit {
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  trending: Post[] = [];
  tagPosts: Post[] = [];
  userMap: Record<number, User> = {};
  suggestions: User[] = [];
  activeTag: string | null = null;
  loading = false;
  loadingSuggestions = false;
  popularTags = POPULAR_TAGS;

  private followService = inject(FollowService);

  ngOnInit(): void {
    this.loadTrending();
    this.loadSuggestions();
    this.route.queryParams.subscribe(params => {
      if (params['tag']) {
        this.activeTag = params['tag'];
        this.loadByHashtag(params['tag']);
      }
    });
  }

  loadTrending(): void {
    this.postService.getTrendingPosts(12).subscribe({
      next: p => {
        this.trending = p;
        this.resolveAuthors(p);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadSuggestions(): void {
    this.loadingSuggestions = true;
    this.followService.getSuggestions(5).subscribe({
      next: suggestions => {
        if (suggestions.length === 0) { this.loadingSuggestions = false; return; }
        forkJoin(suggestions.map(s => this.authService.getUserById(s.suggestedUserId))).subscribe({
          next: users => {
            this.suggestions = users;
            this.loadingSuggestions = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loadingSuggestions = false; }
        });
      },
      error: () => { this.loadingSuggestions = false; }
    });
  }

  loadByHashtag(tag: string): void {
    this.loading = true;
    this.activeTag = tag;
    this.postService.getByHashtag(tag).subscribe({
      next: p => {
        this.tagPosts = p;
        this.loading = false;
        this.resolveAuthors(p);
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
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

    // Dynamically extract hashtags for the cloud
    const allTags = posts
      .flatMap(p => p.hashtags?.split(',') || [])
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
    
    if (allTags.length > 0) {
      const counts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      this.popularTags = [...new Set([...sorted, ...POPULAR_TAGS])].slice(0, 15);
    }
  }

  selectTag(tag: string): void {
    this.router.navigate([], { queryParams: { tag } });
  }

  clearTag(): void {
    this.activeTag = null;
    this.tagPosts = [];
    this.router.navigate([]);
  }
}
