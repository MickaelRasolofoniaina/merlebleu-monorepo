import { OrderStatus } from '@merlebleu/shared';
import { formatDate } from './date';
import { isOrderLate } from './order';

function daysFromToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}

describe('isOrderLate', () => {
  it('is late when the delivery date is past and the order is not delivered', () => {
    expect(isOrderLate({ deliveryDate: daysFromToday(-1), orderStatus: OrderStatus.TODO })).toBeTrue();
    expect(
      isOrderLate({ deliveryDate: daysFromToday(-3), orderStatus: OrderStatus.TODELIVER }),
    ).toBeTrue();
  });

  it('is not late when the order is delivered or cancelled', () => {
    expect(
      isOrderLate({ deliveryDate: daysFromToday(-1), orderStatus: OrderStatus.DELIVERED }),
    ).toBeFalse();
    expect(
      isOrderLate({ deliveryDate: daysFromToday(-1), orderStatus: OrderStatus.CANCELLED }),
    ).toBeFalse();
  });

  it('is not late when the delivery date is today or later', () => {
    expect(isOrderLate({ deliveryDate: daysFromToday(0), orderStatus: OrderStatus.TODO })).toBeFalse();
    expect(isOrderLate({ deliveryDate: daysFromToday(2), orderStatus: OrderStatus.TODO })).toBeFalse();
  });
});
