import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserPreferencesService } from './user-preferences.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  getSession(): Observable<unknown> {
    return this.http.get<unknown>(`${this.apiUrl}/me`, { withCredentials: true });
  }

  logout(): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/logout`, null, {
        withCredentials: true,
      })
      .pipe(tap(() => this.userPreferencesService.clearCache()));
  }
}
