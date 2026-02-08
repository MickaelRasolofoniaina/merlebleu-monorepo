import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateChildFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getSession().pipe(
    map(() => true),
    catchError((error) => {
      if (error?.status === 401) {
        void router.navigate(['/identity/login']);
      }
      return of(false);
    }),
  );
};
