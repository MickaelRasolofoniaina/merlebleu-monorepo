import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListOrder } from './list-order';

describe('ListOrder', () => {
  let component: ListOrder;
  let fixture: ComponentFixture<ListOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOrder],
    }).compileComponents();

    fixture = TestBed.createComponent(ListOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
