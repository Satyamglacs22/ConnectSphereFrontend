import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginDto, RegisterDto, User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (token && userId) {
        this.loadCurrentUser(parseInt(userId));
      }
    }
  }

  // ── Auth ────────────────────────────────────────────────
  register(dto: RegisterDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users/register`, dto);
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/users/login`, dto).pipe(
      tap(response => {
        if (!isPlatformBrowser(this.platformId)) return;
        localStorage.setItem('token', response.token);
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        const userId =
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        localStorage.setItem('userId', userId);
        this.loadCurrentUser(parseInt(userId));
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ── Token helpers ───────────────────────────────────────
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('token');
  }

  getCurrentUserId(): number | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const id = localStorage.getItem('userId');
    return id ? parseInt(id) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ── User read ───────────────────────────────────────────
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/${id}`);
  }

  getUserByUsername(name: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/byUsername/${name}`);
  }

  searchUsers(q: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/users/search?q=${q}`);
  }

  refreshCurrentUser(): void {
    const id = this.getCurrentUserId();
    if (id) this.loadCurrentUser(id);
  }

  // ── Profile update ──────────────────────────────────────
  updateProfile(id: number, dto: { fullName?: string; bio?: string; avatarUrl?: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/api/users/${id}/profile`, dto).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  // ── Avatar upload ───────────────────────────────────────
  uploadAvatar(id: number, file: File): Observable<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.put<{ avatarUrl: string }>(
      `${this.apiUrl}/api/users/${id}/avatar`, form
    ).pipe(
      tap(res => {
        const u = this.currentUserSubject.value;
        if (u) this.currentUserSubject.next({ ...u, avatarUrl: res.avatarUrl });
      })
    );
  }

  // ── Privacy toggle ──────────────────────────────────────
  togglePrivacy(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/users/${id}/togglePrivacy`, {}).pipe(
      tap(() => {
        const u = this.currentUserSubject.value;
        if (u) this.currentUserSubject.next({ ...u, isPrivate: !u.isPrivate });
      })
    );
  }

  // ── Password change ─────────────────────────────────────
  changePassword(id: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/users/${id}/password`,
      { currentPassword, newPassword }
    );
  }

  // ── Deactivate account ──────────────────────────────────
  deactivateAccount(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/users/${id}`);
  }

  private loadCurrentUser(userId: number): void {
    this.http
      .get<User>(`${this.apiUrl}/api/users/${userId}`)
      .subscribe(user => this.currentUserSubject.next(user));
  }
}
