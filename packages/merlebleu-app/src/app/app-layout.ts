import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, interval } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
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

interface MenuEntry {
  id?: string;
  label: string;
  icon?: string;
  routerLink?: string[];
  heading?: boolean;
}

interface MenuSection {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  prefixes: string[];
  items: MenuEntry[];
}

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BadgeModule,
    TooltipModule,
    AvatarModule,
    Button,
    Popover,
    OverlayBadge,
    NotificationPanelComponent,
  ],
  templateUrl: './app-layout.html',
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

  protected readonly sections: MenuSection[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      shortLabel: 'Bord',
      icon: 'pi pi-chart-bar',
      prefixes: ['/dashboard'],
      items: [
        { label: "Aujourd'hui", icon: 'pi pi-calendar', routerLink: ['/dashboard/today'] },
        { label: 'Commandes', icon: 'pi pi-chart-bar', routerLink: ['/dashboard/order'] },
      ],
    },
    {
      id: 'orders',
      label: 'Commandes',
      shortLabel: 'Cmd.',
      icon: 'pi pi-shopping-cart',
      prefixes: ['/sale/order', '/notification'],
      items: [
        { label: 'Toutes', icon: 'pi pi-cart-minus', routerLink: ['/sale/order/list'] },
        { label: "Aujourd'hui", heading: true },
        {
          id: 'today-to-prepare',
          label: 'À préparer',
          icon: 'pi pi-box',
          routerLink: ['/sale/order/today/to-prepare'],
        },
        {
          id: 'today-to-deliver',
          label: 'À livrer',
          icon: 'pi pi-truck',
          routerLink: ['/sale/order/today/to-deliver'],
        },
        { label: 'À venir', heading: true },
        { label: 'À préparer', icon: 'pi pi-box', routerLink: ['/sale/order/to-prepare'] },
        { label: 'Suivi', heading: true },
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
      id: 'ingredients',
      label: 'Ingrédients',
      shortLabel: 'Ingr.',
      icon: 'pi pi-database',
      prefixes: ['/ingredient'],
      items: [
        { label: 'Achat', icon: 'pi pi-wallet', routerLink: ['/ingredient/purchase'] },
        { label: 'Inventaire', icon: 'pi pi-clipboard', routerLink: ['/ingredient/inventory'] },
        { label: 'Liste', icon: 'pi pi-database', routerLink: ['/ingredient/ingredient'] },
        { label: 'Catégorie', icon: 'pi pi-hashtag', routerLink: ['/ingredient/category'] },
        { label: 'Unité', icon: 'pi pi-book', routerLink: ['/ingredient/unit'] },
      ],
    },
    {
      id: 'expenses',
      label: 'Dépenses',
      shortLabel: 'Dép.',
      icon: 'pi pi-money-bill',
      prefixes: ['/expense'],
      items: [
        { label: 'Grille du mois', icon: 'pi pi-table', routerLink: ['/expense/grid'] },
        { label: 'Dépenses fixes', icon: 'pi pi-calendar-clock', routerLink: ['/expense/fixed'] },
        { label: 'Catégories', icon: 'pi pi-hashtag', routerLink: ['/expense/category'] },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventaire',
      shortLabel: 'Stock',
      icon: 'pi pi-box',
      prefixes: ['/inventory'],
      items: [{ label: 'Articles', icon: 'pi pi-box', routerLink: ['/inventory/item'] }],
    },
    {
      id: 'settings',
      label: 'Paramètres',
      shortLabel: 'Param.',
      icon: 'pi pi-cog',
      prefixes: ['/identity', '/shop', '/sale/payment'],
      items: [
        { label: 'Utilisateurs', icon: 'pi pi-user', routerLink: ['/identity/user'] },
        { label: 'Mon profil', icon: 'pi pi-id-card', routerLink: ['/identity/profile'] },
        { label: 'Boutique', icon: 'pi pi-shop', routerLink: ['/shop'] },
        { label: 'Méthode de paiement', icon: 'pi pi-credit-card', routerLink: ['/sale/payment'] },
      ],
    },
  ];

  protected readonly selectedSectionId = signal(this.sections[1].id);
  protected readonly selectedSection = computed(
    () =>
      this.sections.find((section) => section.id === this.selectedSectionId()) ?? this.sections[0],
  );

  protected selectSection(id: string): void {
    this.selectedSectionId.set(id);
  }

  protected sectionHasBadge(section: MenuSection): boolean {
    return section.items.some((item) => this.getBadge(item.id) !== null);
  }

  private syncSectionWithUrl(url: string): void {
    const path = url.split(/[?#]/)[0];
    const match = this.sections.find((section) =>
      section.prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)),
    );
    if (match) {
      this.selectedSectionId.set(match.id);
    }
  }

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

    this.syncSectionWithUrl(this.router.url);

    // counters change when orders are updated on any page, so refresh on each navigation
    this.menuCounterService.refresh();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.syncSectionWithUrl((event as NavigationEnd).urlAfterRedirects);
        this.menuCounterService.refresh();
      });
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
