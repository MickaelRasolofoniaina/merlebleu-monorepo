import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { OrderDisplayMode, UpdateProfileDto, UserDto } from '@merlebleu/shared';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/user`;
  private cachedUser$: Observable<UserDto> | null = null;

  getCurrentUser(): Observable<UserDto> {
    if (!this.cachedUser$) {
      this.cachedUser$ = this.http
        .get<UserDto>(`${this.apiUrl}/me`)
        .pipe(shareReplay(1));
    }

    return this.cachedUser$;
  }

  updateDefaultDisplayMode(mode: OrderDisplayMode): Observable<UserDto> {
    return this.http
      .patch<UserDto>(`${this.apiUrl}/me`, { defaultOrderDisplayMode: mode })
      .pipe(
        tap((user) => {
          this.cachedUser$ = of(user);
        }),
      );
  }

  updateProfile(profile: UpdateProfileDto): Observable<UserDto> {
    return this.http.patch<UserDto>(`${this.apiUrl}/me/profile`, profile).pipe(
      tap((user) => {
        this.cachedUser$ = of(user);
      }),
    );
  }
}
