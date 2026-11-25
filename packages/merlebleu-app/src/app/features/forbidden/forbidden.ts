import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'forbidden',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <i class="pi pi-lock text-5xl text-slate-400 dark:text-slate-500"></i>
      <h2 class="text-2xl font-bold">Pas d'accès</h2>
      <p class="text-slate-500 dark:text-slate-400">
        Vous n'avez pas les droits nécessaires pour consulter cette page.
      </p>
      <a
        routerLink="/dashboard/today"
        class="font-semibold text-blue-600 hover:underline dark:text-blue-400"
      >
        Retour au tableau de bord
      </a>
    </div>
  `,
})
export class Forbidden {}
