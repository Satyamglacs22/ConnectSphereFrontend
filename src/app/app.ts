import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { User } from './models/user.model';
import { CreatePostDialogComponent } from './components/home/create-post-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Use signals to avoid NG0100 hydration mismatches
  loggedIn = signal(false);
  currentUser = signal<User | null>(null);
  unreadCount = signal(0);

  private sub = new Subscription();

  ngOnInit(): void {
    this.sub.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser.set(user);
        this.loggedIn.set(!!user || this.authService.isLoggedIn());
        this.cdr.detectChanges();

        if (user) {
          this.notifService.getUnreadCount(user.userId).subscribe((res: any) => {
            this.unreadCount.set(res?.unreadCount ?? 0);
            this.cdr.detectChanges();
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  openCreatePost(): void {
    this.dialog.open(CreatePostDialogComponent, {
      width: '560px',
      maxWidth: '96vw',
      panelClass: 'glass-dialog'
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
