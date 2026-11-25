import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  CreateExpenseCategoryDto,
  ExpenseCategory,
  ExpenseSection,
  createExpenseCategorySchema,
} from '@merlebleu/shared';
import { CATEGORY_SECTIONS } from '../../../expense.model';

@Component({
  selector: 'mb-category-form',
  templateUrl: './category-form.component.html',
  imports: [FormsModule, InputTextModule, SelectModule],
})
export class CategoryFormComponent {
  readonly formId = input('expense-category-form');
  readonly category = input<ExpenseCategory | null>(null);
  readonly save = output<CreateExpenseCategoryDto>();

  protected readonly sections = CATEGORY_SECTIONS;

  protected readonly label = signal('');
  protected readonly section = signal<ExpenseCategory['section']>(ExpenseSection.CURRENT);
  protected readonly submitted = signal(false);

  private readonly result = computed(() =>
    createExpenseCategorySchema.safeParse({ label: this.label(), section: this.section() }),
  );

  protected readonly labelError = computed(() => {
    const result = this.result();
    return result.success ? null : (result.error.issues.find((i) => i.path[0] === 'label')?.message ?? null);
  });

  constructor() {
    effect(() => {
      const category = this.category();
      this.submitted.set(false);
      this.label.set(category?.label ?? '');
      this.section.set(category?.section ?? ExpenseSection.CURRENT);
    });
  }

  /** Clears the designation and the validation state, keeping the selected section. */
  reset(): void {
    this.submitted.set(false);
    this.label.set('');
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    const result = this.result();
    if (result.success) {
      this.save.emit(result.data);
    }
  }
}
