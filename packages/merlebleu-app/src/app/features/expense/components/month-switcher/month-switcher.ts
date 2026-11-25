import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ExpenseStoreService } from '../../expense-store.service';

@Component({
  selector: 'mb-month-switcher',
  templateUrl: './month-switcher.html',
  imports: [ButtonModule],
})
export class MonthSwitcherComponent {
  protected readonly store = inject(ExpenseStoreService);
}
