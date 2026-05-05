import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PostService } from '../../services/post.service';
import { CommentService } from '../../services/comment.service';
import { LikeService } from '../../services/like.service';
import { AuthService } from '../../services/auth.service';
import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';
import { FollowService } from '../../services/follow.service';
import { LikersDialogComponent } from '../post-card/likers-dialog.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
            MatFormFieldModule, MatInputModule, MatDividerModule, MatProgressSpinnerModule,
            MatSnackBarModule, MatDialogModule, MatMenuModule, MatTooltipModule],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);
  private commentService = inject(CommentService);
  private likeService = inject(LikeService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private followService = inject(FollowService);

  post = signal<Post | null>(null);
  author = signal<any | null>(null);
  comments = signal<Comment[]>([]);
  hasLiked = signal(false);
  likeCount = signal(0);
  loading = signal(true);

  // Edit post
  isEditing = signal(false);
  editContent = '';
  editHashtags = '';
  editVisibility = 'PUBLIC';
  saving = signal(false);

  // Comment state
  newComment = '';
  editingCommentId = signal<number | null>(null);
  editingCommentContent = '';
  replyingToCommentId = signal<number | null>(null);
  replyContent = '';
  replies = signal<Record<number, Comment[]>>({});
  loadingReplies = signal<Record<number, boolean>>({});
  commentLikes = signal<Record<number, { hasLiked: boolean; likeCount: number }>>({});
  currentMediaIndex = signal(0);

  userId: number | null = null;
  isOwnPost = false;

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    this.route.params.subscribe(p => {
      const id = parseInt(p['id']);
      this.loadPost(id);
      this.loadComments(id);
    });
  }

  // ── Post ────────────────────────────────────────────────
  loadPost(id: number): void {
    this.loading.set(true);
    this.postService.getPostById(id).subscribe({
      next: post => {
        this.post.set(post);
        this.likeCount.set(post.likeCount);
        this.isOwnPost = this.userId === post.userId;
        
        // Fetch author
        this.authService.getUserById(post.userId).subscribe(user => {
          this.author.set(user);
          this.cdr.detectChanges();
        });

        this.loading.set(false);
        if (this.userId) {
          this.likeService.hasLiked(this.userId, id).subscribe((r: any) => {
            this.hasLiked.set(r.hasLiked ?? false);
            this.cdr.detectChanges();
          });
        }
        this.cdr.detectChanges();
      },
      error: () => this.loading.set(false)
    });
  }

  // ── Like post ───────────────────────────────────────────
  toggleLike(): void {
    if (!this.userId || !this.post()) return;
    this.likeService.toggleLike(this.userId, this.post()!.postId).subscribe((r: any) => {
      this.hasLiked.set(r.liked ?? !this.hasLiked());
      this.likeCount.set(r.likeCount ?? this.likeCount());
      this.cdr.detectChanges();
    });
  }

  openLikersDialog(): void {
    if (!this.post()) return;
    this.likeService.getLikersForTarget(this.post()!.postId).subscribe(res => {
      const ids = res.likerIds ?? [];
      this.dialog.open(LikersDialogComponent, {
        width: '380px',
        panelClass: 'glass-dialog',
        data: { ids, title: 'People who liked this' }
      });
    });
  }

  // ── Edit post ───────────────────────────────────────────
  startEdit(): void {
    const p = this.post();
    if (!p) return;
    this.editContent = p.content;
    this.editHashtags = p.hashtags ?? '';
    this.editVisibility = p.visibility;
    this.isEditing.set(true);
  }

  cancelEdit(): void { this.isEditing.set(false); }

  saveEdit(): void {
    if (!this.editContent.trim() || !this.post()) return;
    this.saving.set(true);
    this.postService.updatePost(this.post()!.postId, {
      content: this.editContent,
      hashtags: this.editHashtags,
      visibility: this.editVisibility
    }).subscribe({
      next: updated => {
        this.post.update(p => ({ ...p!, ...updated }));
        this.isEditing.set(false);
        this.saving.set(false);
        this.snackBar.open('Post updated!', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => { this.saving.set(false); }
    });
  }

  // ── Delete post ─────────────────────────────────────────
  deletePost(): void {
    if (!this.post()) return;
    if (!confirm('Delete this post?')) return;
    this.postService.deletePost(this.post()!.postId).subscribe(() => {
      this.snackBar.open('Post deleted.', 'Close', { duration: 2000 });
      this.router.navigate(['/home']);
    });
  }

  blockUser(): void {
    if (!this.post()) return;
    if (!confirm(`Block ${this.author()?.userName || 'this user'}? You won't see their posts anymore.`)) return;
    this.followService.blockUser(this.post()!.userId).subscribe({
      next: () => {
        this.snackBar.open('User blocked.', 'Close', { duration: 2000 });
        this.router.navigate(['/home']);
      },
      error: () => this.snackBar.open('Failed to block user.', 'Close', { duration: 2000 })
    });
  }

  // ── Comments ────────────────────────────────────────────
  loadComments(postId: number): void {
    this.commentService.getTopLevelComments(postId).subscribe({
      next: c => {
        this.comments.set(c);
        if (this.userId) c.forEach(cm => this.loadCommentLikeState(cm.commentId));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.userId || !this.post()) return;
    this.commentService.addComment({
      postId: this.post()!.postId, userId: this.userId, content: this.newComment
    }).subscribe(c => {
      this.comments.update(list => [c, ...list]);
      this.newComment = '';
      this.cdr.detectChanges();
    });
  }

  // ── Comment edit ────────────────────────────────────────
  startEditComment(comment: Comment): void {
    this.editingCommentId.set(comment.commentId);
    this.editingCommentContent = comment.content;
  }

  cancelEditComment(): void { this.editingCommentId.set(null); }

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

  // ── Comment delete ──────────────────────────────────────
  deleteComment(commentId: number): void {
    if (!confirm('Delete this comment?')) return;
    this.commentService.deleteComment(commentId).subscribe(() => {
      this.comments.update(list => list.filter(c => c.commentId !== commentId));
      this.snackBar.open('Comment deleted.', 'Close', { duration: 1500 });
      this.cdr.detectChanges();
    });
  }

  // ── Comment reply ───────────────────────────────────────
  startReply(commentId: number): void {
    this.replyingToCommentId.set(commentId);
    this.replyContent = '';
    if (!this.replies()[commentId]) this.loadReplies(commentId);
  }

  cancelReply(): void { this.replyingToCommentId.set(null); }

  loadReplies(commentId: number): void {
    this.loadingReplies.update(m => ({ ...m, [commentId]: true }));
    this.commentService.getReplies(commentId).subscribe(r => {
      this.replies.update(m => ({ ...m, [commentId]: r }));
      this.loadingReplies.update(m => ({ ...m, [commentId]: false }));
      this.cdr.detectChanges();
    });
  }

  submitReply(commentId: number): void {
    if (!this.replyContent.trim() || !this.userId || !this.post()) return;
    this.commentService.addComment({
      postId: this.post()!.postId, userId: this.userId,
      content: this.replyContent, parentCommentId: commentId
    }).subscribe(reply => {
      this.replies.update(m => ({ ...m, [commentId]: [...(m[commentId] ?? []), reply] }));
      this.replyContent = '';
      this.replyingToCommentId.set(null);
      this.cdr.detectChanges();
    });
  }

  // ── Comment like ────────────────────────────────────────
  loadCommentLikeState(commentId: number): void {
    if (!this.userId) return;
    this.likeService.hasLiked(this.userId, commentId, 'COMMENT').subscribe((res: any) => {
      this.commentLikes.update(m => ({ ...m, [commentId]: { hasLiked: res.hasLiked ?? false, likeCount: 0 } }));
      this.likeService.getLikeCount(commentId, 'COMMENT').subscribe((r: any) => {
        this.commentLikes.update(m => ({ ...m, [commentId]: { ...m[commentId], likeCount: r.likeCount ?? 0 } }));
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
  getMediaList(): string[] {
    const p = this.post();
    if (!p) return [];
    if (p.mediaList && p.mediaList.length > 0) {
      return p.mediaList.filter(url => !!url && url.trim() !== '');
    }
    return p.mediaUrl ? [p.mediaUrl] : [];
  }

  nextMedia(): void {
    const list = this.getMediaList();
    if (list.length === 0) return;
    this.currentMediaIndex.update(i => (i + 1) % list.length);
  }

  prevMedia(): void {
    const list = this.getMediaList();
    if (list.length === 0) return;
    this.currentMediaIndex.update(i => (i - 1 + list.length) % list.length);
  }

  isOwnComment(comment: Comment): boolean { return this.userId === comment.userId; }

  share(): void {
    if (!this.post()) return;
    const url = `${window.location.origin}/post/${this.post()!.postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied!', 'Close', { duration: 2000 });
      this.postService.incrementShareCount(this.post()!.postId).subscribe(() => {
        this.post.update(p => {
          if (p) p.shareCount = (p.shareCount || 0) + 1;
          return p;
        });
        this.cdr.detectChanges();
      });
    });
  }

  getHashtags(): string[] {
    return this.post()?.hashtags?.split(',').map(t => t.trim()).filter(Boolean) ?? [];
  }

  searchHashtag(tag: string): void {
    this.router.navigate(['/explore'], { queryParams: { tag: tag.replace('#', '').trim() } });
  }

  timeAgo(date: any): string {
    const dateStr = typeof date === 'string' && !date.endsWith('Z') && !date.includes('+') ? `${date}Z` : date;
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
