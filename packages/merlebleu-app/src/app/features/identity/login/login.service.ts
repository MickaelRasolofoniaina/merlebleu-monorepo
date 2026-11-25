import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginResponseDto, SignInUserDto } from '@merlebleu/shared';
import { UserPreferencesService } from '../../../shared/services/user-preferences.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  signIn(data: SignInUserDto): Observable<LoginResponseDto> {
    // the cached user belongs to the previous session
    this.userPreferencesService.clearCache();

    return this.http
      .post<LoginResponseDto>(`${this.apiUrl}/signin`, data, {
        headers: { 'x-skip-global-error': 'true' },
        withCredentials: true,
      })
      .pipe(tap(() => this.userPreferencesService.clearCache()));
  }
}
