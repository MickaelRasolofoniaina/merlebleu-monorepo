import { Component, OnChanges, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { EXPENSE_SECTIONS, ExpenseCategory, ExpenseSection } from '../../../expense.model';

export type CategoryFormValue = Omit<ExpenseCategory, 'id'>;

@Component({
  selector: 'mb-category-form',
  templateUrl: './category-form.component.html',
  imports: [FormsModule, InputTextModule, SelectModule],
})
export class CategoryFormComponent implements OnChanges {
  readonly formId = input('expense-category-form');
  readonly category = input<ExpenseCategory | null>(null);
  readonly save = output<CategoryFormValue>();

  protected readonly sections = EXPENSE_SECTIONS;

  protected label = '';
  protected section: ExpenseSection = 'CURRENT';
  protected submitted = false;

  ngOnChanges(): void {
    this.submitted = false;
    const category = this.category();
    this.label = category?.label ?? '';
    this.section = category?.section ?? 'CURRENT';
  }

  protected onSubmit(): void {
    this.submitted = true;
    if (!this.label.trim()) return;
    this.save.emit({
      label: this.label.trim(),
      section: this.section,
    });
  }
}
