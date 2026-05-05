import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { User } from '../../models/user.model';
import { Post } from '../../models/post.model';
import { PostCardComponent } from '../post-card/post-card.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatTabsModule,
    MatIconModule, MatProgressSpinnerModule, MatButtonModule,
    PostCardComponent
  ],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private postService = inject(PostService);

  query = signal('');
  users = signal<User[]>([]);
  posts = signal<Post[]>([]);
  loading = signal(false);
  activeTab = signal<'users' | 'posts'>('users');

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      this.query.set(q);
      if (q) this.performSearch(q);
    });
  }

  performSearch(q: string): void {
    this.loading.set(true);
    // Search users
    this.authService.searchUsers(q).subscribe({
      next: u => { this.users.set(u); this.checkLoading(); },
      error: () => this.checkLoading()
    });
    // Search posts
    this.postService.searchPosts(q).subscribe({
      next: p => { this.posts.set(p); this.checkLoading(); },
      error: () => this.checkLoading()
    });
  }

  checkLoading(): void {
    // Basic logic to stop spinner
    this.loading.set(false);
  }

  switchTab(tab: 'users' | 'posts'): void {
    this.activeTab.set(tab);
  }
}
