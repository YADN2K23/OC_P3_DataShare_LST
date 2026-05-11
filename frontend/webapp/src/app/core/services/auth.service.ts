import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, UserInfo } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {}

  register(login: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/register`, { login, password });
  }

  login(login: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { login, password }, { withCredentials: true }).pipe(
      tap((response) => {
        this.setToken(response.token);
      })
    );
  }

  refreshSession(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((response) => {
        this.setToken(response.token);
      })
    );
  }

  ensureAuthenticated(): Observable<boolean> {
    if (this.hasToken()) {
      return of(true);
    }

    return this.refreshSession().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  logout(): void {
    this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  getMe(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiUrl}/me`);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string): void {
    this.accessToken = token;
  }

  private clearSession(): void {
    this.accessToken = null;
  }
}

