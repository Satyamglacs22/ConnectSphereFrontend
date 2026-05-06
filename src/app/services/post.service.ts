import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreatePostDto, Post } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createPost(dto: CreatePostDto): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/api/posts`, dto);
  }

  uploadMedia(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/api/posts/upload`, formData);
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/api/posts/${id}`);
  }

  getPostsByUser(userId: number, page: number = 1, pageSize: number = 10): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/api/posts/user/${userId}?page=${page}&pageSize=${pageSize}`);
  }

  getPublicPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/api/posts/public`);
  }

  getTrendingPosts(topN: number = 10): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/api/posts/trending?topN=${topN}`);
  }

  searchPosts(q: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/api/posts/search?q=${q}`);
  }

  getByHashtag(tag: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/api/posts/hashtag/${tag}`);
  }

  updatePost(id: number, dto: any): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/api/posts/${id}`, dto);
  }

  incrementShareCount(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/posts/${id}/counts`, { field: 'ShareCount', delta: 1 });
  }

  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/posts/${id}`);
  }
}
