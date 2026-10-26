import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DashboardView } from '@merlebleu/shared';

@Component({
  selector: 'dashboard-widget',
  imports: [FormsModule, CardModule, SelectButtonModule],
  templateUrl: './dashboard-widget.html',
})
export class DashboardWidget {
  heading = input.required<string>();
  view = model.required<DashboardView>();

  protected readonly viewOptions = [
    { label: 'Mois', value: DashboardView.MONTH },
    { label: 'Année', value: DashboardView.YEAR },
  ];
}
