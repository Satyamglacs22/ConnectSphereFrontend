import { Component, Input, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';
import { User } from '../../models/user.model';
import { LikeService } from '../../services/like.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { BookmarkService } from '../../services/bookmark.service';
import { FollowService } from '../../services/follow.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { LikersDialogComponent } from './likers-dialog.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    TimeAgoPipe
  ],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent implements OnInit {
  @Input() post!: Post;
  @Input() author: User | null = null;

  private likeService = inject(LikeService);
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private bookmarkService = inject(BookmarkService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private followService = inject(FollowService);
  private cdr = inject(ChangeDetectorRef);

  userId: number | null = null;
  hasLiked = signal(false);
  isBookmarked = signal(false);
  likeCount = signal(0);
  comments = signal<Comment[]>([]);
  showComments = false;
  newComment = '';
  isDeleted = signal(false);
  isOwnPost = false;

  // Edit post state
  isEditing = signal(false);
  editContent = '';
  editHashtags = '';
  editVisibility = 'PUBLIC';
  saving = signal(false);
  showHeartPop = signal(false);

  // Carousel state
  currentMediaIndex = signal(0);

  nextMedia(event: Event): void {
    event.stopPropagation();
    const list = this.getMediaList();
    if (list.length === 0) return;
    this.currentMediaIndex.update(i => (i + 1) % list.length);
  }

  prevMedia(event: Event): void {
    event.stopPropagation();
    const list = this.getMediaList();
    if (list.length === 0) return;
    this.currentMediaIndex.update(i => (i - 1 + list.length) % list.length);
  }

  getMediaList(): string[] {
    if (this.post.mediaList && this.post.mediaList.length > 0) {
      return this.post.mediaList.filter(url => !!url && url.trim() !== '');
    }
    return this.post.mediaUrl ? [this.post.mediaUrl] : [];
  }


  // Comment state
  editingCommentId = signal<number | null>(null);
  editingCommentContent = '';
  replyingToCommentId = signal<number | null>(null);
  replyContent = '';
  replies = signal<Record<number, Comment[]>>({});
  loadingReplies = signal<Record<number, boolean>>({});
  commentLikes = signal<Record<number, { hasLiked: boolean; likeCount: number }>>({});

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    this.likeCount.set(this.post.likeCount);
    this.isOwnPost = this.userId === this.post.userId;
    this.checkIfLiked();
    this.checkIfBookmarked();
  }

  // ── Bookmarks ──────────────────────────────────────────
  checkIfBookmarked(): void {
    if (!this.userId) return;
    this.bookmarkService.isBookmarked(this.post.postId).subscribe(res => {
      this.isBookmarked.set(res.bookmarked);
      this.cdr.detectChanges();
    });
  }

  toggleBookmark(): void {
    if (!this.userId) return;
    this.bookmarkService.toggleBookmark(this.post.postId).subscribe(res => {
      this.isBookmarked.set(res.bookmarked);
      this.snackBar.open(res.message, 'Close', { duration: 2000 });
      this.cdr.detectChanges();
    });
  }

  // ── Like ────────────────────────────────────────────────
  checkIfLiked(): void {
    if (!this.userId) return;
    this.likeService.hasLiked(this.userId, this.post.postId).subscribe((res: any) => {
      this.hasLiked.set(res.hasLiked ?? false);
      this.cdr.detectChanges();
    });
  }

  toggleLike(): void {
    if (!this.userId) return;
    this.likeService.toggleLike(this.userId, this.post.postId).subscribe((res: any) => {
      this.hasLiked.set(res.liked ?? !this.hasLiked());
      this.likeCount.set(res.likeCount ?? this.likeCount());
      this.cdr.detectChanges();
    });
  }

  openLikersDialog(): void {
    this.likeService.getLikersForTarget(this.post.postId).subscribe(res => {
      const ids = res.likerIds ?? [];
      this.dialog.open(LikersDialogComponent, {
        width: '380px',
        panelClass: 'glass-dialog',
        data: { ids, title: 'People who liked this' }
      });
    });
  }

  onDoubleTap(): void {
    if (!this.hasLiked()) {
      this.toggleLike();
    }
    this.showHeartPop.set(true);
    setTimeout(() => this.showHeartPop.set(false), 800);
  }

  // ── Edit Post ───────────────────────────────────────────
  startEdit(): void {
    this.editContent = this.post.content;
    this.editHashtags = this.post.hashtags ?? '';
    this.editVisibility = this.post.visibility;
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  saveEdit(): void {
    if (!this.editContent.trim()) return;
    this.saving.set(true);
    this.postService.updatePost(this.post.postId, {
      content: this.editContent,
      hashtags: this.editHashtags,
      visibility: this.editVisibility
    }).subscribe({
      next: updated => {
        this.post = { ...this.post, ...updated };
        this.isEditing.set(false);
        this.saving.set(false);
        this.snackBar.open('Post updated!', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => { this.saving.set(false); this.snackBar.open('Failed to update post.', 'Close', { duration: 2000 }); }
    });
  }

  // ── Delete Post ─────────────────────────────────────────
  deletePost(): void {
    if (!confirm('Delete this post?')) return;
    this.postService.deletePost(this.post.postId).subscribe(() => {
      this.isDeleted.set(true);
      this.snackBar.open('Post deleted.', 'Close', { duration: 2000 });
      this.cdr.detectChanges();
    });
  }

  // ── Blocking ────────────────────────────────────────────
  blockUser(): void {
    if (!confirm(`Block ${this.author?.userName || 'this user'}? You won't see their posts anymore.`)) return;
    this.followService.blockUser(this.post.userId).subscribe({
      next: () => {
        this.snackBar.open('User blocked.', 'Close', { duration: 2000 });
        this.isDeleted.set(true); // Hide the post
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to block user.', 'Close', { duration: 2000 })
    });
  }

  // ── Comments ────────────────────────────────────────────
  toggleComments(): void {
    this.showComments = !this.showComments;
    if (this.showComments && this.comments().length === 0) this.loadComments();
  }

  loadComments(): void {
    this.commentService.getTopLevelComments(this.post.postId).subscribe(c => {
      this.comments.set(c);
      // Load comment like states
      if (this.userId) {
        c.forEach(comment => this.loadCommentLikeState(comment.commentId));
      }
      this.cdr.detectChanges();
    });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.userId) return;
    this.commentService.addComment({
      postId: this.post.postId,
      userId: this.userId,
      content: this.newComment
    }).subscribe(comment => {
      this.comments.update(c => [comment, ...c]);
      this.newComment = '';
      this.post.commentCount++;
      this.cdr.detectChanges();
    });
  }

  // ── Comment Edit ────────────────────────────────────────
  startEditComment(comment: Comment): void {
    this.editingCommentId.set(comment.commentId);
    this.editingCommentContent = comment.content;
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);
    this.editingCommentContent = '';
  }

  saveEditComment(commentId: number): void {
    if (!this.editingCommentContent.trim()) return;
    this.commentService.editComment(commentId, this.editingCommentContent).subscribe(updated => {
      this.comments.update(list =>
        list.map(c => c.commentId === commentId ? { ...c, content: updated.content, isEdited: true } : c)
      );
      this.cancelEditComment();
      this.cdr.detectChanges();
    });
  }

  // ── Comment Delete ──────────────────────────────────────
  deleteComment(commentId: number): void {
    if (!confirm('Delete this comment?')) return;
    this.commentService.deleteComment(commentId).subscribe(() => {
      this.comments.update(list => list.filter(c => c.commentId !== commentId));
      this.post.commentCount = Math.max(0, this.post.commentCount - 1);
      this.snackBar.open('Comment deleted.', 'Close', { duration: 1500 });
      this.cdr.detectChanges();
    });
  }

  // ── Comment Reply ───────────────────────────────────────
  startReply(commentId: number): void {
    this.replyingToCommentId.set(commentId);
    this.replyContent = '';
    // Load existing replies if not loaded
    if (!this.replies()[commentId]) this.loadReplies(commentId);
  }

  cancelReply(): void {
    this.replyingToCommentId.set(null);
    this.replyContent = '';
  }

  loadReplies(commentId: number): void {
    this.loadingReplies.update(m => ({ ...m, [commentId]: true }));
    this.commentService.getReplies(commentId).subscribe(r => {
      this.replies.update(m => ({ ...m, [commentId]: r }));
      this.loadingReplies.update(m => ({ ...m, [commentId]: false }));
      this.cdr.detectChanges();
    });
  }

  submitReply(commentId: number): void {
    if (!this.replyContent.trim() || !this.userId) return;
    this.commentService.addComment({
      postId: this.post.postId,
      userId: this.userId,
      content: this.replyContent,
      parentCommentId: commentId
    }).subscribe(reply => {
      this.replies.update(m => ({ ...m, [commentId]: [...(m[commentId] ?? []), reply] }));
      this.replyContent = '';
      this.replyingToCommentId.set(null);
      this.cdr.detectChanges();
    });
  }

  // ── Comment Like ────────────────────────────────────────
  loadCommentLikeState(commentId: number): void {
    if (!this.userId) return;
    this.likeService.hasLiked(this.userId, commentId, 'COMMENT').subscribe((res: any) => {
      this.commentLikes.update(m => ({
        ...m,
        [commentId]: { hasLiked: res.hasLiked ?? false, likeCount: 0 }
      }));
      this.likeService.getLikeCount(commentId, 'COMMENT').subscribe((r: any) => {
        this.commentLikes.update(m => ({
          ...m,
          [commentId]: { ...m[commentId], likeCount: r.likeCount ?? 0 }
        }));
        this.cdr.detectChanges();
      });
    });
  }


  toggleCommentLike(commentId: number): void {
    if (!this.userId) return;
    this.likeService.toggleLike(this.userId, commentId, 'COMMENT').subscribe((res: any) => {
      this.commentLikes.update(m => ({
        ...m,
        [commentId]: { hasLiked: res.liked ?? !m[commentId]?.hasLiked, likeCount: res.likeCount ?? m[commentId]?.likeCount }
      }));
      this.cdr.detectChanges();
    });
  }

  // ── Helpers ─────────────────────────────────────────────
  openPost(): void {
    this.router.navigate(['/post', this.post.postId]);
  }

  searchHashtag(tag: string): void {
    this.router.navigate(['/explore'], { queryParams: { tag: tag.replace('#', '').trim() } });
  }

  share(): void {
    const url = `${window.location.origin}/post/${this.post.postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied!', 'Close', { duration: 2000 });
      this.postService.incrementShareCount(this.post.postId).subscribe(() => {
        this.post.shareCount = (this.post.shareCount || 0) + 1;
        this.cdr.detectChanges();
      });
    });
  }

  getHashtags(): string[] {
    return this.post.hashtags ? this.post.hashtags.split(',').map(t => t.trim()).filter(Boolean) : [];
  }

  getInitials(): string {
    if (this.author) {
      return this.author.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U' + this.post.userId;
  }

  isOwnComment(comment: Comment): boolean {
    return this.userId === comment.userId;
  }

  hasReplies(commentId: number): boolean {
    return (this.replies()[commentId]?.length ?? 0) > 0;
  }

  isReplyVisible(commentId: number): boolean {
    return this.replyingToCommentId() === commentId || this.hasReplies(commentId);
  }
}
