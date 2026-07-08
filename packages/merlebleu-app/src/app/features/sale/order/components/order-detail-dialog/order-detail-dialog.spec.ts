import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderDetailDialog } from './order-detail-dialog';

describe('OrderDetailDialog', () => {
  let component: OrderDetailDialog;
  let fixture: ComponentFixture<OrderDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
