import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MenuModule,
    BadgeModule,
    RippleModule,
    AvatarModule,
    Button,
    OverlayBadgeModule,
    ToastModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
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
        },
        {
          label: 'Caisse',
          icon: 'pi pi-dollar',
        },
      ],
    },
    {
      label: 'Dépenses',
      items: [
        {
          label: 'Ingrédients',
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
      label: 'Paramètres',
      items: [
        {
          label: 'Utilisateurs',
          icon: 'pi pi-user',
          routerLink: ['/identity/user'],
        },
        {
          label: 'Rôles',
          icon: 'pi pi-users',
        },
        {
          label: 'Méthode de paiement',
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
}
