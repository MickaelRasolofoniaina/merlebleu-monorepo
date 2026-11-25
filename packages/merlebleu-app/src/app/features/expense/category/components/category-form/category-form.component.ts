import { Component, OnChanges, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  EXPENSE_SECTIONS,
  ExpenseCategory,
  ExpenseSection,
  LINKABLE_INGREDIENTS,
} from '../../../expense.model';

export type CategoryFormValue = Omit<ExpenseCategory, 'id'>;

@Component({
  selector: 'mb-category-form',
  templateUrl: './category-form.component.html',
  imports: [FormsModule, InputNumberModule, InputTextModule, SelectModule],
})
export class CategoryFormComponent implements OnChanges {
  readonly formId = input('expense-category-form');
  readonly category = input<ExpenseCategory | null>(null);
  readonly save = output<CategoryFormValue>();

  protected readonly sections = EXPENSE_SECTIONS;
  protected readonly ingredients = LINKABLE_INGREDIENTS;

  protected label = '';
  protected section: ExpenseSection = 'CURRENT';
  protected linkedIngredient: string | null = null;
  protected usualAmount: number | null = null;
  protected submitted = false;

  ngOnChanges(): void {
    this.submitted = false;
    const category = this.category();
    this.label = category?.label ?? '';
    this.section = category?.section ?? 'CURRENT';
    this.linkedIngredient = category?.linkedIngredient ?? null;
    this.usualAmount = category?.usualAmount ?? null;
  }

  protected onSubmit(): void {
    this.submitted = true;
    if (!this.label.trim()) return;
    this.save.emit({
      label: this.label.trim(),
      section: this.section,
      linkedIngredient: this.linkedIngredient,
      usualAmount: this.usualAmount ?? 0,
    });
  }
}
