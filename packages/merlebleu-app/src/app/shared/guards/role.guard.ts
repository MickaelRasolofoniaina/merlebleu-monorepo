import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@merlebleu/shared';
import { catchError, map, of } from 'rxjs';
import { UserPreferencesService } from '../services/user-preferences.service';

/**
 * Lets only the roles listed in the route data (`data: { roles: [...] }`) through,
 * and sends the other users to the "no access" page.
 */
export const roleGuard: CanActivateFn = (route) => {
  const userPreferencesService = inject(UserPreferencesService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] ?? []) as UserRole[];
  const forbidden = router.createUrlTree(['/forbidden']);

  return userPreferencesService.getCurrentUser().pipe(
    map((user) => allowedRoles.includes(user.role) || forbidden),
    // errors are already reported by httpErrorInterceptor
    catchError(() => of(forbidden)),
  );
};
