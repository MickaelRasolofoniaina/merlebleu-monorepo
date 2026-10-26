import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderCountCard } from './order-count-card';

describe('OrderCountCard', () => {
  let fixture: ComponentFixture<OrderCountCard>;

  const render = (count: number): HTMLElement => {
    fixture = TestBed.createComponent(OrderCountCard);
    fixture.componentRef.setInput('color', 'orange');
    fixture.componentRef.setInput('icon', 'pi pi-exclamation-triangle');
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('label', 'en retard');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OrderCountCard] }).compileComponents();
  });

  it('shows the count with a singular label', () => {
    const text = render(1).textContent ?? '';

    expect(text).toContain('1');
    expect(text.replace(/\s+/g, ' ')).toContain('commande en retard');
  });

  it('pluralizes the label from two orders', () => {
    expect((render(5).textContent ?? '').replace(/\s+/g, ' ')).toContain('commandes en retard');
  });

  it('applies the classes of its color', () => {
    const card = render(2).querySelector('div') as HTMLElement;

    expect(card.className).toContain('bg-orange-500/10');
  });
});
