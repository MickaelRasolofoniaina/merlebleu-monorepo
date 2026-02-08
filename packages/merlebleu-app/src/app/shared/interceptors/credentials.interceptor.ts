import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const skipCredentials = req.headers.has('x-skip-credentials');
  if (skipCredentials) {
    return next(req);
  }

  return next(
    req.clone({
      withCredentials: true,
    }),
  );
};
