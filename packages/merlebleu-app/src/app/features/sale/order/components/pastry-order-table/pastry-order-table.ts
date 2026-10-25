import { Component, OnInit, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DEFAULT_PAGE_SIZE, Item, ItemType, OrderItemRowDto, OrderStatus, Shape } from '@merlebleu/shared';
import { formatDate } from '@shared/utils/date';
import {
  DELIVERY_PRIORITIES,
  getDeliveryPriorityColor,
  getDeliveryPriorityLabel,
  getOrderStatusColor,
  getOrderStatusLabel,
} from '@shared/utils/order';
import { ItemService } from '@features/inventory/item/item.service';
import { OrderItemRowFilters } from '../../order.service';

@Component({
  selector: 'pastry-order-table',
  providers: [ItemService],
  imports: [
    FormsModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    Button,
    BadgeModule,
    DatePipe,
  ],
  templateUrl: './pastry-order-table.html',
  styleUrl: './pastry-order-table.scss',
})
export class PastryOrderTable implements OnInit {
  rows = input<OrderItemRowDto[]>([]);
  loading = input(false);
  totalRecords = input(0);
  pageSize = input(DEFAULT_PAGE_SIZE);
  first = input(0);
  showEditAction = input(false);
  showCompleteAction = input(false);
  showDeliverAction = input(false);
  completingOrderIds = input<Set<string>>(new Set());

  pageChange = output<{ first: number; rows: number }>();
  filter = output<OrderItemRowFilters>();
  resetFilter = output<void>();
  viewDetail = output<string>();
  editOrder = output<string>();
  complete = output<string>();
  deliver = output<string>();

  protected readonly OrderStatus = OrderStatus;
  protected readonly priorities = DELIVERY_PRIORITIES;
  protected shapes = Object.values(Shape);
  protected patisserieItems: Item[] = [];

  protected filters = {
    customerName: '',
    deliveryDate: null as Date | null,
    type: '',
    shape: null as Shape | null,
    size: null as number | null,
  };

  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    this.itemService.getItemsByType(ItemType.CAKE).subscribe((items) => {
      this.patisserieItems = items;
    });
  }

  protected hasActions(): boolean {
    return this.showEditAction() || this.showCompleteAction() || this.showDeliverAction();
  }

  protected onPageChange(event: { first: number; rows: number }): void {
    this.pageChange.emit(event);
  }

  protected applyFilters(): void {
    this.filter.emit({
      customerName: this.filters.customerName || undefined,
      deliveryDate: this.filters.deliveryDate ? formatDate(this.filters.deliveryDate) : undefined,
      type: this.filters.type || undefined,
      shape: this.filters.shape ?? undefined,
      size: this.filters.size ?? undefined,
    });
  }

  protected resetFilters(): void {
    this.filters = {
      customerName: '',
      deliveryDate: null,
      type: '',
      shape: null,
      size: null,
    };
    this.resetFilter.emit();
  }

  protected getStatus(orderStatus: OrderStatus | undefined): string {
    return getOrderStatusLabel(orderStatus);
  }

  protected getStatusColor(
    orderStatus: OrderStatus | undefined,
  ): 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    return getOrderStatusColor(orderStatus);
  }

  protected getPriorityLabel(row: OrderItemRowDto): string {
    return getDeliveryPriorityLabel(row.deliveryDate);
  }

  protected getPriorityColor(row: OrderItemRowDto): 'danger' | 'warn' | 'info' {
    return getDeliveryPriorityColor(row.deliveryDate);
  }

  protected isCompleting(orderId: string): boolean {
    return this.completingOrderIds().has(orderId);
  }

  protected isOrderCompleted(row: OrderItemRowDto): boolean {
    return row.orderStatus === OrderStatus.TODELIVER;
  }

  protected onViewDetail(row: OrderItemRowDto): void {
    this.viewDetail.emit(row.orderId);
  }

  protected onEdit(row: OrderItemRowDto): void {
    this.editOrder.emit(row.orderId);
  }

  protected onComplete(row: OrderItemRowDto): void {
    this.complete.emit(row.orderId);
  }

  protected onDeliver(row: OrderItemRowDto): void {
    this.deliver.emit(row.orderId);
  }
}
