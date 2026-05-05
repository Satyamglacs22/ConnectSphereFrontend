import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, map } from 'rxjs';

import { FollowService } from '../../services/follow.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { FollowSuggestion } from '../../models/follow.model';

interface SuggestedUserExtended extends User {
  mutualCount: number;
  mutualFriendIds: number[];
}

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './suggestions.component.html',
  styleUrl: './suggestions.component.scss'
})
export class SuggestionsComponent implements OnInit {
  private followService = inject(FollowService);
  private authService = inject(AuthService);

  suggestedUsers = signal<SuggestedUserExtended[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadSuggestions();
  }

  loadSuggestions(): void {
    this.followService.getSuggestions(5).subscribe({
      next: suggestions => {
        if (suggestions.length === 0) {
          this.loading.set(false);
          this.suggestedUsers.set([]);
          return;
        }
        
        forkJoin(
          suggestions.map(s => 
            this.authService.getUserById(s.suggestedUserId).pipe(
              map(user => ({
                ...user,
                mutualCount: s.mutualCount,
                mutualFriendIds: s.mutualFriendIds
              } as SuggestedUserExtended))
            )
          )
        ).subscribe({
          next: users => {
            this.suggestedUsers.set(users);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  follow(user: SuggestedUserExtended): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) return;
    
    this.followService.followUser(currentUserId, user.userId).subscribe(() => {
      this.suggestedUsers.update(list => list.filter(u => u.userId !== user.userId));
      if (this.suggestedUsers().length === 0) this.loadSuggestions();
    });
  }
}
