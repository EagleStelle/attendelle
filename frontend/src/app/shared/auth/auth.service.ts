import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthResponse {
  token: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  // Track the logged in state
  readonly currentUser = signal<AuthResponse | null>(null);

  constructor() {
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        try {
          this.currentUser.set(JSON.parse(stored));
        } catch (e) {
          this.logout();
        }
      }
    }
  }

  login(schoolId: string, password: string): Observable<AuthResponse> {
    const apiUrl = (import.meta as any).env?.API_URL || 'http://localhost:8080/api';
    return this.http.post<AuthResponse>(`${apiUrl}/auth/login`, { schoolId, password })
      .pipe(
        tap((response) => {
          this.currentUser.set(response);
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_user', JSON.stringify(response));
          }
        })
      );
  }

  logout() {
    this.currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }
}
