import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../shared/auth/auth.service';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideGraduationCap,
  lucideLayoutDashboard,
  lucideLogOut,
  lucidePanelLeft,
  lucideSettings,
  lucideUserRound,
  lucideUsers,
  lucideUserX,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  HlmNavigationMenu,
  HlmNavigationMenuItem,
  HlmNavigationMenuLink,
  HlmNavigationMenuList,
} from '@spartan-ng/helm/navigation-menu';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmButton,
    HlmNavigationMenu,
    HlmNavigationMenuList,
    HlmNavigationMenuItem,
    HlmNavigationMenuLink,
  ],
  viewProviders: [
    provideIcons({
      lucideLayoutDashboard,
      lucideUsers,
      lucideClock,
      lucideUserX,
      lucidePanelLeft,
      lucideGraduationCap,
      lucideUserRound,
      lucideLogOut,
      lucideSettings,
    }),
  ],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  protected readonly sidebarOpen = signal(true);

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'lucideLayoutDashboard', route: '/dashboard' },
    { label: 'Students', icon: 'lucideUsers', route: '/students' },
    { label: 'Attendance', icon: 'lucideClock', route: '/attendance' },
    { label: 'Manage', icon: 'lucideSettings', route: '/manage' },
    { label: 'Deleted Students', icon: 'lucideUserX', route: '/deleted-students' },
  ];

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly pageTitle = signal(this.resolveTitle());
  protected readonly currentUser = this.authService.currentUser;

  constructor() {
    // Client-side authentication check for initial load (SSR bypasses guard)
    if (isPlatformBrowser(this.platformId) && !this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.pageTitle.set(this.resolveTitle()));
  }

  private resolveTitle(): string {
    const url = this.router.url;
    return this.navItems.find((i) => url.startsWith(i.route))?.label ?? 'Dashboard';
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  protected logout(): void {
    this.authService.logout();
  }
}
