import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateStockEntriesDto, Ingredient } from '@merlebleu/shared';
import { StockEntryBatchComponent } from './stock-entry-batch.component';

const FLOUR_ID = '11111111-1111-4111-8111-111111111111';
const SUGAR_ID = '22222222-2222-4222-8222-222222222222';
const BUTTER_ID = '33333333-3333-4333-8333-333333333333';

const ingredients: Ingredient[] = [
  { id: FLOUR_ID, label: 'farine', stock: 14, unit: { id: 'u1', label: 'kg' } },
  { id: SUGAR_ID, label: 'sucre', stock: 6.5, unit: { id: 'u1', label: 'kg' } },
  {
    id: BUTTER_ID,
    label: 'beurre',
    stock: 3000,
    unit: { id: 'u2', label: 'g' },
    entryUnit: { id: 'u3', label: 'carton' },
    entryUnitFactor: 10000,
  },
];

describe('StockEntryBatchComponent', () => {
  let fixture: ComponentFixture<StockEntryBatchComponent>;
  let component: StockEntryBatchComponent;
  let submitted: CreateStockEntriesDto[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StockEntryBatchComponent] }).compileComponents();
    fixture = TestBed.createComponent(StockEntryBatchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ingredients', ingredients);
    fixture.detectChanges();
    submitted = [];
    component.batchSubmit.subscribe((dto) => submitted.push(dto));
  });

  const firstKey = () => component.lines()[0].key;

  it('starts with today as the date and one empty line', () => {
    expect(component.lines().length).toBe(1);
    expect(component.entryDate()?.toDateString()).toBe(new Date().toDateString());
    expect(component.readyCount()).toBe(0);
  });

  it('adds a line and keeps one empty line when the last one is removed', () => {
    component.addLine();
    expect(component.lines().length).toBe(2);

    component.removeLine(component.lines()[0].key);
    component.removeLine(component.lines()[0].key);
    expect(component.lines().length).toBe(1);
  });

  it('does not offer an ingredient already picked on another line', () => {
    component.addLine();
    component.patchLine(firstKey(), { ingredientId: FLOUR_ID });
    const second = component.lines()[1];

    expect(component.optionsFor(second).map((i) => i.id)).toEqual([SUGAR_ID, BUTTER_ID]);
    expect(component.optionsFor(component.lines()[0]).length).toBe(3);
  });

  it('computes the stock after the entry', () => {
    component.patchLine(firstKey(), { ingredientId: FLOUR_ID, quantity: 25 });

    expect(component.stockAfter(component.lines()[0])).toBe(39);
  });

  it('selects the entry unit by default when the ingredient has one', () => {
    component.onIngredientChange(firstKey(), BUTTER_ID);
    expect(component.lines()[0].unit).toBe('entry');

    component.onIngredientChange(firstKey(), FLOUR_ID);
    expect(component.lines()[0].unit).toBe('stock');
  });

  it('converts a quantity typed in the entry unit', () => {
    component.onIngredientChange(firstKey(), BUTTER_ID);
    component.patchLine(firstKey(), { quantity: 2 });
    const line = component.lines()[0];

    expect(component.isConverted(line)).toBeTrue();
    expect(component.convertedQuantity(line)).toBe(20000);
    expect(component.stockAfter(line)).toBe(23000);
  });

  it('adds the typed quantity as is when the stock unit is chosen', () => {
    component.onIngredientChange(firstKey(), BUTTER_ID);
    component.patchLine(firstKey(), { quantity: 2500, unit: 'stock' });
    const line = component.lines()[0];

    expect(component.isConverted(line)).toBeFalse();
    expect(component.convertedQuantity(line)).toBe(2500);
    expect(component.stockAfter(line)).toBe(5500);
  });

  it('sends the chosen unit with each line', () => {
    component.onIngredientChange(firstKey(), BUTTER_ID);
    component.patchLine(firstKey(), { quantity: 2 });

    component.onSubmit();

    expect(submitted[0].lines).toEqual([{ ingredientId: BUTTER_ID, quantity: 2, unit: 'entry' }]);
  });

  it('ignores blank lines and emits the filled ones', () => {
    component.addLine();
    component.patchLine(firstKey(), { ingredientId: FLOUR_ID, quantity: 25 });

    component.onSubmit();

    expect(submitted.length).toBe(1);
    expect(submitted[0].lines).toEqual([{ ingredientId: FLOUR_ID, quantity: 25, unit: 'stock' }]);
  });

  it('flags a missing quantity on the right line', () => {
    component.addLine();
    component.patchLine(component.lines()[1].key, { ingredientId: SUGAR_ID });

    component.onSubmit();

    expect(submitted.length).toBe(0);
    expect(component.lineError(1, 'quantity')).not.toBe('');
  });

  it('refuses a quantity of 0', () => {
    component.patchLine(firstKey(), { ingredientId: FLOUR_ID, quantity: 0 });

    component.onSubmit();

    expect(submitted.length).toBe(0);
  });

  it('refuses an empty batch', () => {
    component.onSubmit();

    expect(submitted.length).toBe(0);
    expect(component.errors()['lines']).toBeTruthy();
  });

  it('resets to a single blank line', () => {
    component.patchLine(firstKey(), { ingredientId: FLOUR_ID, quantity: 5 });

    component.reset();

    expect(component.lines().length).toBe(1);
    expect(component.lines()[0].ingredientId).toBeNull();
  });
});
