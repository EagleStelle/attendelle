import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true; // Let SSR pass through
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
