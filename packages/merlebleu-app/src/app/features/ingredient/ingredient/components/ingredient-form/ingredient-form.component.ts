import { Component, Input, Output, EventEmitter, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  CreateIngredientDto,
  IngredientUnit,
  PaymentMethod,
  UpdateIngredientDto,
  createIngredientSchema,
  updateIngredientSchema,
} from '@merlebleu/shared';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PaymentService } from '../../../../sale/payment/payment.service';

@Component({
  selector: 'mb-ingredient-form',
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
  standalone: true,
  imports: [FormsModule, InputTextModule, SelectModule],
})
export class IngredientFormComponent {
  @Input() itemData?: CreateIngredientDto | UpdateIngredientDto | null;
  @Input() formId = 'ingredient-form';
  @Input() units: IngredientUnit[] = [];
  @Output() itemSubmit = new EventEmitter<CreateIngredientDto | UpdateIngredientDto>();

  @ViewChild(NgForm) private readonly ngForm?: NgForm;

  private readonly paymentService = inject(PaymentService);
  protected readonly paymentMethods = signal<PaymentMethod[]>([]);

  /** Id of the "Espèces" payment method, preselected when creating an ingredient. */
  private cashMethodId: string | null = null;

  constructor() {
    this.paymentService.getAllPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods.set(methods);
        this.cashMethodId = methods.find((method) => this.isCash(method.name))?.id ?? null;
        if (!this.itemData && !this.item.defaultPaymentMethodId) {
          this.item = { ...this.item, defaultPaymentMethodId: this.cashMethodId };
        }
      },
    });
  }

  private isCash(name: string): boolean {
    return name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase()
      .startsWith('espece');
  }

  validationError: ReturnType<typeof createIngredientSchema.safeParse>['error'] | null = null;

  item: CreateIngredientDto | UpdateIngredientDto = this.createEmpty();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData']) {
      this.validationError = null;
      this.item = this.itemData ? { ...this.itemData } : this.createEmpty();
      this.ngForm?.resetForm(this.item);
    }
  }

  onSubmit() {
    this.validationError = null;
    const schema = this.itemData ? updateIngredientSchema : createIngredientSchema;
    const result = schema.safeParse(this.item);

    if (!result.success) {
      this.validationError = result.error;
      return;
    }

    this.itemSubmit.emit({ ...result.data });
    // In edit mode the parent resets the form (itemData change) once the save succeeded.
    if (!this.itemData) {
      this.resetForm();
    }
  }

  getFieldError(field: keyof CreateIngredientDto): string {
    return this.validationError?.issues.find((issue) => issue.path[0] === field)?.message ?? '';
  }

  private resetForm(): void {
    this.validationError = null;
    this.item = this.createEmpty();
    // Reset the NgForm state (submitted/dirty/touched) so that the `required`
    // controls do not appear invalid right after a successful submission.
    this.ngForm?.resetForm(this.item);
  }

  private createEmpty(): CreateIngredientDto {
    return { label: '', unitId: '', defaultPaymentMethodId: this.cashMethodId };
  }
}
