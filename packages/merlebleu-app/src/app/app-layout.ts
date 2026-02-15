import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    MenuModule,
    BadgeModule,
    RippleModule,
    AvatarModule,
    Button,
    OverlayBadgeModule,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
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
          label: 'Ingredients',
          icon: 'pi pi-truck',
        },
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
    this.authService.getSession().subscribe({
      next: (session) => {
        const name = this.getUserLabel(session);
        this.userInitials = name.slice(0, 2).toUpperCase();
      },
    });
  }

  private getUserLabel(session: unknown): string {
    const payload = session as { name?: string; email?: string };
    const raw = (payload.name ?? payload.email ?? '').trim();
    return raw.length > 0 ? raw : '??';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/identity/login']);
      },
      error: () => {
        void this.router.navigate(['/identity/login']);
      },
    });
  }
}
