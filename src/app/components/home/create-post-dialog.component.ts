import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-create-post-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, 
    MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="prism-dialog">
      <div class="prism-dialog-header">
        <button mat-icon-button mat-dialog-close class="close-btn"><mat-icon>close</mat-icon></button>
        <span class="title">Create new post</span>
        <button mat-button class="share-btn" (click)="submit()" [disabled]="!content.trim() || loading">
          {{ loading ? 'Posting...' : 'Share' }}
        </button>
      </div>

      <div class="prism-dialog-body">
        <!-- Media Preview Area -->
        <div class="media-area" [class.empty]="mediaUrls.length === 0" (click)="mediaUrls.length === 0 ? fileInput.click() : null">
          @if (mediaUrls.length === 0) {
            <div class="upload-placeholder">
              <mat-icon>perm_media</mat-icon>
              <p>Add photos</p>
            </div>
          } @else {
            <div class="media-preview-container">
              <img [src]="mediaUrls[0]" class="main-preview" />
              
              @if (mediaUrls.length > 1) {
                <div class="count-badge">+{{ mediaUrls.length - 1 }} more</div>
              }
              <button mat-icon-button class="clear-media" (click)="$event.stopPropagation(); mediaUrls = []; selectedFiles = []">
                <mat-icon>cancel</mat-icon>
              </button>
            </div>
          }
          <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" multiple style="display: none" />
        </div>

        <!-- Details Area -->
        <div class="details-area">
          <div class="user-row" *ngIf="currentUser">
            <div class="avatar-glow">
               <img *ngIf="currentUser.avatarUrl" [src]="currentUser.avatarUrl" />
               <span *ngIf="!currentUser.avatarUrl">{{ currentUser.fullName[0] }}</span>
            </div>
            <span class="username">&#64;{{ currentUser.userName }}</span>
          </div>

          <textarea 
            [(ngModel)]="content" 
            placeholder="Write a caption..." 
            class="caption-input"
            rows="6"
          ></textarea>

          <div class="extra-fields">
            <div class="field-row">
              <mat-icon>tag</mat-icon>
              <input [(ngModel)]="hashtags" placeholder="Add hashtags (comma separated)" />
            </div>
            <div class="field-row">
              <mat-icon>public</mat-icon>
              <select [(ngModel)]="visibility">
                <option value="PUBLIC">Public</option>
                <option value="FOLLOWERS_ONLY">Followers only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prism-dialog { 
      background: white; 
      color: #1e293b; 
      border-radius: 40px; 
      overflow: hidden; 
      display: flex; 
      flex-direction: column; 
      height: 100%; 
      box-shadow: 0 40px 80px -20px rgba(99, 102, 241, 0.3);
    }
    
    .prism-dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 28px; height: 80px; border-bottom: 1px solid rgba(99, 102, 241, 0.08);
      .title { font-weight: 800; font-size: 20px; color: #1e293b; letter-spacing: -0.8px; }
      .share-btn { 
        background: var(--prism-primary-gradient) !important; 
        color: white !important; 
        font-weight: 800; 
        font-size: 15px; 
        border-radius: 16px;
        padding: 0 24px;
        box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.4);
      }
      .close-btn { color: #64748b; }
    }

    .prism-dialog-body {
      display: grid; grid-template-columns: 1fr 360px; min-height: 520px;
      @media (max-width: 800px) { grid-template-columns: 1fr; }
    }

    .media-area {
      background: #f8fafc; display: flex; align-items: center; justify-content: center;
      position: relative; cursor: pointer; border-right: 1px solid rgba(99, 102, 241, 0.08);
      &.empty:hover { background: #f1f5f9; }
    }

    .upload-placeholder {
      text-align: center; color: #64748b;
      mat-icon { font-size: 80px; width: 80px; height: 80px; margin-bottom: 16px; opacity: 0.2; color: var(--prism-primary); }
      p { font-size: 17px; font-weight: 800; letter-spacing: -0.2px; }
    }

    .media-preview-container {
      width: 100%; height: 100%; position: relative; background: #000;
      .main-preview { width: 100%; height: 100%; object-fit: contain; }
      .count-badge {
        position: absolute; bottom: 24px; right: 24px;
        background: rgba(0,0,0,0.8); color: white; padding: 8px 16px; border-radius: 14px; font-size: 13px; font-weight: 800;
      }
      .clear-media { position: absolute; top: 24px; right: 24px; color: white; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
    }

    .details-area {
      padding: 32px; display: flex; flex-direction: column; gap: 32px;
      .user-row {
        display: flex; align-items: center; gap: 16px;
        .avatar-glow {
          width: 44px; height: 44px; border-radius: 50%; background: var(--prism-primary-gradient); 
          padding: 2px; overflow: hidden; display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: white;
          img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid white; }
        }
        .username { font-weight: 800; font-size: 16px; color: #1e293b; }
      }
    }

    .caption-input {
      background: transparent; border: none; color: #1e293b; outline: none;
      resize: none; font-size: 17px; width: 100%; font-family: inherit; font-weight: 600;
      line-height: 1.7;
      &::placeholder { color: #94a3b8; }
    }

    .extra-fields {
      border-top: 1px solid rgba(99, 102, 241, 0.08); padding-top: 32px; display: flex; flex-direction: column; gap: 20px;
      .field-row {
        display: flex; align-items: center; gap: 16px; color: #64748b;
        mat-icon { font-size: 24px; width: 24px; height: 24px; color: var(--prism-primary); }
        input, select {
          background: transparent; border: none; color: #1e293b; outline: none; flex: 1; font-size: 15px; font-weight: 700;
        }
        option { background: white; }
      }
    }
  `]
})
export class CreatePostDialogComponent implements OnInit {
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreatePostDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  content = '';
  hashtags = '';
  mediaUrls: string[] = [];
  selectedFiles: File[] = [];
  visibility = 'PUBLIC';
  loading = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.cdr.detectChanges();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.handleImages(Array.from(input.files));
    input.value = '';
  }

  handleImages(files: File[]): void {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const remaining = 5 - this.selectedFiles.length;
    const toProcess = imageFiles.slice(0, remaining);

    toProcess.forEach(file => {
      this.selectedFiles.push(file);
      
      // Still create a preview for UI
      const reader = new FileReader();
      reader.onload = (e) => {
        this.mediaUrls.push(e.target!.result as string);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    return url.startsWith('data:video/') || url.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm');
  }

  async submit(): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId || !this.content.trim()) return;
    this.loading = true;

    try {
      // 1. Upload all files to Azure and get real URLs
      const uploadPromises = this.selectedFiles.map(file => 
        this.postService.uploadMedia(file).toPromise()
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const azureUrls = uploadResults.map(res => res?.url).filter(url => !!url) as string[];

      // 2. Create the post with Azure URLs
      this.postService.createPost({
        userId,
        content: this.content,
        hashtags: this.hashtags || undefined,
        mediaUrls: azureUrls.length > 0 ? azureUrls : undefined,
        mediaType: azureUrls.length > 0 ? (this.isVideo(azureUrls[0]) ? 'VIDEO' : 'IMAGE') : undefined,
        visibility: this.visibility
      }).subscribe({
        next: (post: Post) => {
          this.snackBar.open('Post published! 🎉', 'Close', { duration: 2500 });
          this.dialogRef.close(post);
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to post. Try again.', 'Close', { duration: 2500 });
        }
      });
    } catch (error) {
      this.loading = false;
      this.snackBar.open('Failed to upload media. Try again.', 'Close', { duration: 2500 });
    }
  }
}
