import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateRecipeDto, Ingredient } from '@merlebleu/shared';
import { RecipeFormComponent } from './recipe-form.component';

const FLOUR_ID = '11111111-1111-4111-8111-111111111111';
const EGG_ID = '22222222-2222-4222-8222-222222222222';

const ingredients: Ingredient[] = [
  { id: FLOUR_ID, label: 'farine', stock: 0, unit: { id: 'u1', label: 'g' } },
  { id: EGG_ID, label: 'oeufs', stock: 0, unit: { id: 'u2', label: 'nombre' } },
];

describe('RecipeFormComponent', () => {
  let fixture: ComponentFixture<RecipeFormComponent>;
  let component: RecipeFormComponent;
  let submitted: CreateRecipeDto[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RecipeFormComponent] }).compileComponents();
    fixture = TestBed.createComponent(RecipeFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ingredients', ingredients);
    fixture.detectChanges();
    submitted = [];
    component.recipeSubmit.subscribe((dto) => submitted.push(dto));
  });

  it('starts with one empty line', () => {
    expect(component.lines.length).toBe(1);
  });

  it('requires a name and a complete line', () => {
    component.onSubmit();

    expect(component.nameError()).toBe('Veuillez saisir le nom de la recette');
    expect(component.lineError(0, 'ingredientId')).toBe("L'ingrédient est requis");
    expect(submitted.length).toBe(0);
  });

  it('refuses a dose of 0', () => {
    component.name = 'Biscuit';
    component.lines = [{ ingredientId: FLOUR_ID, quantity: 0 }];

    component.onSubmit();

    expect(component.lineError(0, 'quantity')).toBe('La dose doit être supérieure à 0');
  });

  it('refuses the same ingredient twice', () => {
    component.name = 'Biscuit';
    component.lines = [
      { ingredientId: FLOUR_ID, quantity: 100 },
      { ingredientId: FLOUR_ID, quantity: 50 },
    ];

    component.onSubmit();

    expect(component.linesError()).toBe("Un ingrédient ne peut apparaître qu'une seule fois");
  });

  it('emits the recipe when the form is valid', () => {
    component.name = '  Biscuit nature ';
    component.lines = [
      { ingredientId: FLOUR_ID, quantity: 1250 },
      { ingredientId: EGG_ID, quantity: 36 },
    ];

    component.onSubmit();

    expect(submitted).toEqual([
      {
        name: 'Biscuit nature',
        lines: [
          { ingredientId: FLOUR_ID, quantity: 1250 },
          { ingredientId: EGG_ID, quantity: 36 },
        ],
      },
    ]);
  });

  it('only offers the ingredients that are not already used in another line', () => {
    component.lines = [
      { ingredientId: FLOUR_ID, quantity: 1 },
      { ingredientId: '', quantity: null },
    ];

    expect(component.availableIngredients('').map((i) => i.id)).toEqual([EGG_ID]);
    expect(component.availableIngredients(FLOUR_ID).map((i) => i.id)).toEqual([FLOUR_ID, EGG_ID]);
  });
});
