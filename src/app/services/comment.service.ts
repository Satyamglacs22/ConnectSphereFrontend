import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddCommentDto, Comment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Add a new comment (or reply if parentCommentId is set)
  addComment(dto: AddCommentDto): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/api/comments`, dto);
  }

  // Get a single comment by ID
  getCommentById(id: number): Observable<Comment> {
    return this.http.get<Comment>(`${this.apiUrl}/api/comments/${id}`);
  }

  // Get all comments for a post (flat list)
  getCommentsByPost(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/api/comments/post/${postId}`);
  }

  // Get only top-level comments (no replies)
  getTopLevelComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      `${this.apiUrl}/api/comments/post/${postId}/topLevel`
    );
  }

  // Get replies to a specific comment
  getReplies(commentId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/api/comments/replies/${commentId}`);
  }

  // Get all comments made by a user
  getCommentsByUser(userId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/api/comments/user/${userId}`);
  }

  // Get total comment count for a post
  getCommentCount(postId: number): Observable<{ postId: number; commentCount: number }> {
    return this.http.get<any>(`${this.apiUrl}/api/comments/count/${postId}`);
  }

  // Edit an existing comment
  editComment(id: number, content: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/api/comments/${id}`, { content });
  }

  // Delete a comment
  deleteComment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/comments/${id}`);
  }
}
