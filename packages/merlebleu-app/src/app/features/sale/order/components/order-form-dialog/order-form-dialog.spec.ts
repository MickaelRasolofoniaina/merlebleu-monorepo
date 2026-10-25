import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderFormDialog } from './order-form-dialog';

describe('OrderFormDialog', () => {
  let component: OrderFormDialog;
  let fixture: ComponentFixture<OrderFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
