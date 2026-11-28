import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CreateIngredientDto, IngredientUnit } from '@merlebleu/shared';
import { PaymentService } from '../../../../sale/payment/payment.service';
import { IngredientFormComponent } from './ingredient-form.component';

const GRAM_ID = '11111111-1111-4111-8111-111111111111';
const BAG_ID = '22222222-2222-4222-8222-222222222222';

const units: IngredientUnit[] = [
  { id: GRAM_ID, label: 'g' },
  { id: BAG_ID, label: 'sac' },
];

describe('IngredientFormComponent', () => {
  let fixture: ComponentFixture<IngredientFormComponent>;
  let component: IngredientFormComponent;
  let submitted: (CreateIngredientDto | unknown)[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientFormComponent],
      providers: [{ provide: PaymentService, useValue: { getAllPaymentMethods: () => of([]) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(IngredientFormComponent);
    component = fixture.componentInstance;
    component.units = units;
    fixture.detectChanges();
    submitted = [];
    component.itemSubmit.subscribe((dto) => submitted.push(dto));
  });

  it('accepts an ingredient without entry unit', () => {
    component.item = { ...component.item, label: 'oeufs', unitId: GRAM_ID };

    component.onSubmit();

    expect(submitted.length).toBe(1);
  });

  it('requires the equivalence when an entry unit is chosen', () => {
    component.item = { ...component.item, label: 'farine', unitId: GRAM_ID, entryUnitId: BAG_ID };

    component.onSubmit();

    expect(submitted.length).toBe(0);
    expect(component.getFieldError('entryUnitFactor')).not.toBe('');
  });

  it('refuses an equivalence of 0', () => {
    component.item = {
      ...component.item,
      label: 'farine',
      unitId: GRAM_ID,
      entryUnitId: BAG_ID,
      entryUnitFactor: 0,
    };

    component.onSubmit();

    expect(submitted.length).toBe(0);
  });

  it('refuses an entry unit equal to the stock unit', () => {
    component.item = {
      ...component.item,
      label: 'farine',
      unitId: GRAM_ID,
      entryUnitId: GRAM_ID,
      entryUnitFactor: 1,
    };

    component.onSubmit();

    expect(submitted.length).toBe(0);
    expect(component.getFieldError('entryUnitId')).not.toBe('');
  });

  it('emits the entry unit and its equivalence', () => {
    component.item = {
      ...component.item,
      label: 'farine',
      unitId: GRAM_ID,
      entryUnitId: BAG_ID,
      entryUnitFactor: 50000,
    };

    component.onSubmit();

    expect(submitted[0]).toEqual(
      jasmine.objectContaining({ entryUnitId: BAG_ID, entryUnitFactor: 50000 }),
    );
  });

  it('drops the equivalence when the entry unit is cleared', () => {
    component.item = { ...component.item, entryUnitId: null, entryUnitFactor: 50000 };

    component.onEntryUnitChange();

    expect(component.item.entryUnitFactor).toBeNull();
  });

  it('does not offer the stock unit as entry unit', () => {
    component.item = { ...component.item, unitId: GRAM_ID };

    expect(component.entryUnitOptions().map((unit) => unit.id)).toEqual([BAG_ID]);
  });
});
