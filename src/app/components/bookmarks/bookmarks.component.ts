import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { BookmarkService } from '../../services/bookmark.service';
import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';
import { PostCardComponent } from '../post-card/post-card.component';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, PostCardComponent],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.scss'
})
export class BookmarksComponent implements OnInit {
  private bookmarkService = inject(BookmarkService);
  private postService = inject(PostService);

  posts = signal<Post[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.bookmarkService.getUserBookmarks().subscribe({
      next: bookmarks => {
        if (bookmarks.length === 0) {
          this.loading.set(false);
          return;
        }
        const postIds = bookmarks.map(b => b.postId);
        forkJoin(postIds.map(id => this.postService.getPostById(id))).subscribe({
          next: posts => {
            this.posts.set(posts);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }
}
