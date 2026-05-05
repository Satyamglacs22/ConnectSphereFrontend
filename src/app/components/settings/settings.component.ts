import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { FollowService } from '../../services/follow.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTabsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private followService = inject(FollowService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  loading = false;
  blockedUsers: User[] = [];

  editData = { fullName: '', bio: '' };
  passData = { oldPassword: '', newPassword: '' };

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      if (u) {
        this.editData.fullName = u.fullName;
        this.editData.bio = u.bio ?? '';
        this.loadBlockedUsers();
      }
      this.cdr.detectChanges();
    });
  }

  loadBlockedUsers(): void {
    this.followService.getBlockedUsers().subscribe(ids => {
      if (ids.length === 0) {
        this.blockedUsers = [];
        this.cdr.detectChanges();
        return;
      }
      forkJoin(ids.map(id => this.authService.getUserById(id))).subscribe(users => {
        this.blockedUsers = users;
        this.cdr.detectChanges();
      });
    });
  }

  updateProfile(): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.authService.updateProfile(this.currentUser.userId, this.editData).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Profile updated! ✨', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  changePassword(): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.authService.changePassword(this.currentUser.userId, this.passData.oldPassword, this.passData.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.passData = { oldPassword: '', newPassword: '' };
        this.snackBar.open('Password changed successfully! 🔒', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  togglePrivacy(): void {
    if (!this.currentUser) return;
    this.authService.togglePrivacy(this.currentUser.userId).subscribe(() => {
      this.currentUser!.isPrivate = !this.currentUser!.isPrivate;
      this.snackBar.open(`Account is now ${this.currentUser!.isPrivate ? 'Private' : 'Public'}`, 'Close', { duration: 2000 });
      this.cdr.detectChanges();
    });
  }

  unblock(userId: number): void {
    this.followService.unblockUser(userId).subscribe(() => {
      this.blockedUsers = this.blockedUsers.filter(u => u.userId !== userId);
      this.snackBar.open('User unblocked.', 'Close', { duration: 2000 });
      this.cdr.detectChanges();
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl = e.target.result;
      this.authService.updateProfile(this.currentUser!.userId, { avatarUrl: dataUrl }).subscribe(() => {
        this.currentUser!.avatarUrl = dataUrl;
        this.snackBar.open('Avatar updated!', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      });
    };
    reader.readAsDataURL(file);
  }

  triggerAvatarUpload(): void {
    document.getElementById('avatar-input')?.click();
  }

  deleteAccount(): void {
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    this.authService.deactivateAccount(this.currentUser!.userId).subscribe(() => {
      this.authService.logout();
    });
  }
}
