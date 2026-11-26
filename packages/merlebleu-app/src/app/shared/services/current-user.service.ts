import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserRole } from '@merlebleu/shared';
import { catchError, of } from 'rxjs';
import { UserPreferencesService } from './user-preferences.service';

/** The signed-in user as signals, to show or hide what only some roles can do. */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly userPreferencesService = inject(UserPreferencesService);

  readonly user = toSignal(
    // errors are already reported by httpErrorInterceptor
    this.userPreferencesService.getCurrentUser().pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  readonly isAdmin = computed(() => this.user()?.role === UserRole.ADMIN);
}
