import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, interval } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { OverlayBadge } from 'primeng/overlaybadge';
import { BadgeModule } from 'primeng/badge';
import { Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { ThemeService } from './shared/services/theme.service';
import { NotificationService } from './shared/services/notification.service';
import { MenuCounterService } from './shared/services/menu-counter.service';
import { NotificationPanelComponent } from './shared/components/notification-panel/notification-panel';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BadgeModule,
    MenuModule,
    RippleModule,
    AvatarModule,
    Button,
    Popover,
    OverlayBadge,
    NotificationPanelComponent,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly menuCounterService = inject(MenuCounterService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly sidebarOpen = signal(true);
  protected readonly name = signal('');

  protected items: MenuItem[] = [
    {
      label: 'Tableau de bord',
      items: [
        {
          label: "Aujourd'hui",
          icon: 'pi pi-calendar',
          routerLink: ['/dashboard/today'],
        },
        {
          label: 'Commandes',
          icon: 'pi pi-chart-bar',
          routerLink: ['/dashboard/order'],
        },
      ],
    },
    {
      label: 'Commandes',
      items: [
        {
          label: 'Toutes',
          icon: 'pi pi-cart-minus',
          routerLink: ['/sale/order/list'],
        },
        {
          label: "Aujourd'hui",
          icon: 'pi pi-calendar',
          disabled: true,
          styleClass: 'menu-parent-item',
        },
        {
          id: 'today-to-prepare',
          label: 'A préparer',
          icon: 'pi pi-box',
          routerLink: ['/sale/order/today/to-prepare'],
          styleClass: 'menu-sub-item',
        },
        {
          id: 'today-to-deliver',
          label: 'A livrer',
          icon: 'pi pi-truck',
          routerLink: ['/sale/order/today/to-deliver'],
          styleClass: 'menu-sub-item',
        },
        {
          label: 'A venir',
          icon: 'pi pi-calendar-plus',
          disabled: true,
          styleClass: 'menu-parent-item',
        },
        {
          label: 'A préparer',
          icon: 'pi pi-box',
          routerLink: ['/sale/order/to-prepare'],
          styleClass: 'menu-sub-item',
        },
        {
          id: 'late',
          label: 'En retard',
          icon: 'pi pi-exclamation-triangle',
          routerLink: ['/sale/order/late'],
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: 'pi pi-bell',
          routerLink: ['/notification'],
        },
      ],
    },
    {
      label: 'Ingredients',
      items: [
        {
          label: 'Achat',
          icon: 'pi pi-wallet',
          routerLink: ['/ingredient/purchase'],
        },
        {
          label: 'Inventaire',
          icon: 'pi pi-clipboard',
          routerLink: ['/ingredient/inventory'],
        },
        {
          label: 'Liste',
          icon: 'pi pi-database',
          routerLink: ['/ingredient/ingredient'],
        },
        {
          label: 'Catégorie',
          icon: 'pi pi-hashtag',
          routerLink: ['/ingredient/category'],
        },
        {
          label: 'Unité',
          icon: 'pi pi-book',
          routerLink: ['/ingredient/unit'],
        },
      ],
    },
    {
      label: 'Inventaire',
      items: [
        {
          label: 'Articles',
          icon: 'pi pi-box',
          routerLink: ['/inventory/item'],
        },
      ],
    },
    {
      label: 'Parametres',
      items: [
        {
          label: 'Utilisateurs',
          icon: 'pi pi-user',
          routerLink: ['/identity/user'],
        },
        {
          label: 'Mon profil',
          icon: 'pi pi-id-card',
          routerLink: ['/identity/profile'],
        },
        {
          label: 'Boutique',
          icon: 'pi pi-shop',
          routerLink: ['/shop'],
        },
        {
          label: 'Methode de paiement',
          icon: 'pi pi-credit-card',
          routerLink: ['/sale/payment'],
        },
      ],
    },
  ];

  protected getBadge(
    id: string | undefined,
  ): { value: number; severity: 'danger' | 'success' | 'warn' | 'info' } | null {
    const badges = {
      'today-to-prepare': { value: this.menuCounterService.todayToPrepare(), severity: 'danger' },
      'today-to-deliver': { value: this.menuCounterService.todayToDeliver(), severity: 'success' },
      late: { value: this.menuCounterService.late(), severity: 'warn' },
      notifications: { value: this.notificationService.unreadCount(), severity: 'info' },
    } as const;
    const badge = id ? (badges as Record<string, (typeof badges)[keyof typeof badges]>)[id] : null;

    return badge && badge.value > 0 ? badge : null;
  }

  ngOnInit(): void {
    const name = localStorage.getItem('user_name') ?? '';
    this.name.set(name);

    this.notificationService.connect();
    this.notificationService.loadRecent();
    this.notificationService.refreshUnreadCount();

    // counters change when orders are updated on any page, so refresh on each navigation
    this.menuCounterService.refresh();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.menuCounterService.refresh());
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.menuCounterService.refresh());
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('user_name');
        void this.router.navigate(['/identity/login']);
      },
      error: () => {
        localStorage.removeItem('user_name');
        void this.router.navigate(['/identity/login']);
      },
    });
  }
}
