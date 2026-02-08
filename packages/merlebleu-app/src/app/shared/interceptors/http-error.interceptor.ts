import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const detail =
        error.status === 400
          ? error.error?.message ?? error.error?.error ?? error.message
          : "Veuillez réessayer plus tard ou contacter l'administrateur si le problème persiste.";

      messageService.add({
        severity: 'error',
        summary: "Une erreur s'est produite!",
        detail,
        life: 5000,
      });

      return throwError(() => error);
    }),
  );
};
