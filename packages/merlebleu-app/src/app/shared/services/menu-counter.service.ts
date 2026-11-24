import { inject, Injectable, signal } from '@angular/core';
import { OrderService } from '@features/sale/order/order.service';

@Injectable({
  providedIn: 'root',
})
export class MenuCounterService {
  private readonly orderService = inject(OrderService);

  readonly todayToPrepare = signal(0);
  readonly todayToDeliver = signal(0);
  readonly late = signal(0);

  // counts are fetched with limit 1: only the `total` of the paged result is needed
  refresh(): void {
    const page = { page: 1, limit: 1 };

    // child orders (order lines), not parent orders
    this.orderService
      .listOrderItemsTodayToPrepare(page)
      .subscribe((result) => this.todayToPrepare.set(result.total));

    this.orderService
      .listOrderItemsTodayToDeliver(page)
      .subscribe((result) => this.todayToDeliver.set(result.total));

    // same unit as the card of the late page: order lines, not parent orders
    this.orderService
      .listOrderItemsLate(page)
      .subscribe((result) => this.late.set(result.total));
  }
}
