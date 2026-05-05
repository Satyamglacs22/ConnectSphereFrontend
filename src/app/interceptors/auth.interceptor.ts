import { HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Reads the token directly from localStorage to avoid a circular dependency:
 *   AuthService → HttpClient → authInterceptor → AuthService (💥 loop)
 *
 * AuthService uses HttpClient internally, so injecting AuthService here
 * would create the cycle. Reading localStorage directly breaks the chain.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    if (token) {
      return next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      }));
    }
  }

  return next(req);
};
