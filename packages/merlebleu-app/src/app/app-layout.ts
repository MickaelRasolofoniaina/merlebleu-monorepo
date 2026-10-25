import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { OverlayBadge } from 'primeng/overlaybadge';
import { Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { ThemeService } from './shared/services/theme.service';
import { NotificationService } from './shared/services/notification.service';
import { NotificationPanelComponent } from './shared/components/notification-panel/notification-panel';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
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
  protected readonly sidebarOpen = signal(true);
  protected readonly name = signal('');

  protected items: MenuItem[] = [
    {
      label: 'Commandes',
      items: [
        {
          label: 'Toutes',
          icon: 'pi pi-cart-minus',
          routerLink: ['/sale/order/list'],
        },
        {
          label: 'A préparer',
          icon: 'pi pi-box',
          routerLink: ['/sale/order/to-prepare'],
        },
        {
          label: 'A livrer',
          icon: 'pi pi-truck',
          routerLink: ['/sale/order/to-deliver'],
        },
      ],
    },
    {
      label: 'Depenses',
      items: [
        {
          label: 'Salaires',
          icon: 'pi pi-wallet',
        },
        {
          label: 'Autres',
          icon: 'pi pi-receipt',
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
          label: 'Roles',
          icon: 'pi pi-users',
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
        {
          label: 'Notifications',
          icon: 'pi pi-bell',
          routerLink: ['/notification'],
        },
        {
          label: 'Autres',
          icon: 'pi pi-wrench',
        },
      ],
    },
  ];

  ngOnInit(): void {
    const name = localStorage.getItem('user_name') ?? '';
    this.name.set(name);

    this.notificationService.connect();
    this.notificationService.loadRecent();
    this.notificationService.refreshUnreadCount();
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
