import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    MenuModule,
    RippleModule,
    AvatarModule,
    Button,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);
  userInitials = '';

  protected items: MenuItem[] = [
    {
      label: 'Ventes',
      items: [
        {
          label: 'Journalier',
          icon: 'pi pi-plus',
        },
        {
          label: 'Commande',
          icon: 'pi pi-cart-minus',
          routerLink: ['/sale/order/'],
        },
        {
          label: 'Caisse',
          icon: 'pi pi-dollar',
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
          routerLink: ['/ingredient/inventaire'],
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
          label: 'Roles',
          icon: 'pi pi-users',
        },
        {
          label: 'Methode de paiement',
          icon: 'pi pi-credit-card',
          routerLink: ['/sale/payment'],
        },
        {
          label: 'Notifications',
          icon: 'pi pi-bell',
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
    this.userInitials = name.slice(0, 2).toUpperCase() || '??';
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
