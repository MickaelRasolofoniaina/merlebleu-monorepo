import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const detail =
        error.error?.message ?? error.error?.error ?? error.message ?? 'Unexpected error occurred.';

      messageService.add({
        severity: 'error',
        summary: "Une erreur est survenue durant l'opération",
        detail,
        life: 5000,
      });

      return throwError(() => error);
    }),
  );
};
