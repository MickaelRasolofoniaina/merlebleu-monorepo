import { Component, OnChanges, SimpleChanges, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CreateRecipeDto, Ingredient, Recipe, createRecipeSchema } from '@merlebleu/shared';
import { capitalizeFirstLetter } from '@shared/utils/text';

interface EditableLine {
  ingredientId: string;
  quantity: number | null;
}

@Component({
  selector: 'mb-recipe-form',
  templateUrl: './recipe-form.component.html',
  imports: [FormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule],
})
export class RecipeFormComponent implements OnChanges {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  recipe = input<Recipe | null>(null);
  formId = input('recipe-form');
  ingredients = input<Ingredient[]>([]);
  recipeSubmit = output<CreateRecipeDto>();

  name = '';
  lines: EditableLine[] = [this.emptyLine()];
  validationError: ReturnType<typeof createRecipeSchema.safeParse>['error'] | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recipe']) {
      this.validationError = null;
      const recipe = this.recipe();
      this.name = recipe?.name ?? '';
      this.lines = recipe
        ? recipe.lines.map((line) => ({
            ingredientId: line.ingredient.id,
            quantity: Number(line.quantity),
          }))
        : [this.emptyLine()];
    }
  }

  unitLabel(ingredientId: string): string {
    return this.ingredients().find((i) => i.id === ingredientId)?.unit.label ?? '';
  }

  availableIngredients(current: string): Ingredient[] {
    const used = new Set(this.lines.map((l) => l.ingredientId).filter((id) => id !== current));
    return this.ingredients().filter((i) => !used.has(i.id));
  }

  canAddLine(): boolean {
    return this.lines.length < this.ingredients().length;
  }

  addLine(): void {
    this.lines = [...this.lines, this.emptyLine()];
  }

  removeLine(index: number): void {
    this.lines = this.lines.filter((_, i) => i !== index);
  }

  onSubmit(): void {
    this.validationError = null;
    const result = createRecipeSchema.safeParse({
      name: this.name,
      lines: this.lines.map((line) => ({
        ingredientId: line.ingredientId,
        quantity: line.quantity,
      })),
    });

    if (!result.success) {
      this.validationError = result.error;
      return;
    }

    this.recipeSubmit.emit(result.data);
  }

  nameError(): string {
    return this.validationError?.issues.find((i) => i.path[0] === 'name')?.message ?? '';
  }

  /** Error of the whole list of lines (empty list, duplicated ingredient). */
  linesError(): string {
    return (
      this.validationError?.issues.find((i) => i.path[0] === 'lines' && i.path.length === 1)
        ?.message ?? ''
    );
  }

  lineError(index: number, field: 'ingredientId' | 'quantity'): string {
    return (
      this.validationError?.issues.find(
        (i) => i.path[0] === 'lines' && i.path[1] === index && i.path[2] === field,
      )?.message ?? ''
    );
  }

  private emptyLine(): EditableLine {
    return { ingredientId: '', quantity: null };
  }
}
