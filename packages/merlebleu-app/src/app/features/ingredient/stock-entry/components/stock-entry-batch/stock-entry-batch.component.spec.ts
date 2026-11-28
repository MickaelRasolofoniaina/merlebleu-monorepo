import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateStockEntriesDto, Ingredient } from '@merlebleu/shared';
import { StockEntryBatchComponent } from './stock-entry-batch.component';

const FLOUR_ID = '11111111-1111-4111-8111-111111111111';
const SUGAR_ID = '22222222-2222-4222-8222-222222222222';

const ingredients: Ingredient[] = [
  { id: FLOUR_ID, label: 'farine', stock: 14, unit: { id: 'u1', label: 'kg' } },
  { id: SUGAR_ID, label: 'sucre', stock: 6.5, unit: { id: 'u1', label: 'kg' } },
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

    expect(component.optionsFor(second).map((i) => i.id)).toEqual([SUGAR_ID]);
    expect(component.optionsFor(component.lines()[0]).length).toBe(2);
  });

  it('computes the stock after the entry', () => {
    component.patchLine(firstKey(), { ingredientId: FLOUR_ID, quantity: 25 });

    expect(component.stockAfter(component.lines()[0])).toBe(39);
  });

  it('ignores blank lines and emits the filled ones', () => {
    component.addLine();
    component.patchLine(firstKey(), { ingredientId: FLOUR_ID, quantity: 25 });

    component.onSubmit();

    expect(submitted.length).toBe(1);
    expect(submitted[0].lines).toEqual([{ ingredientId: FLOUR_ID, quantity: 25 }]);
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
