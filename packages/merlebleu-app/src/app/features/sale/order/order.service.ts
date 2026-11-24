import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CreateOrderDto,
  UpdateOrderDto,
  Order,
  OrderItemRowDto,
  OrderStatus,
  PaginationParams,
  ResultPaged,
} from '@merlebleu/shared';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/order`;

  addOrder(order: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  listOrders(
    paginationParams: PaginationParams,
    filters?: Record<string, unknown>,
  ): Observable<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}?page=${page}&limit=${limit}`;

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryString += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }

    return this.http.get<ResultPaged<Order>>(queryString);
  }

  listOrdersToPrepare(
    paginationParams: PaginationParams,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
    orderDate?: string,
    deliveryDate?: string,
  ): Observable<ResultPaged<Order>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/to-prepare?page=${page}&limit=${limit}`;

    if (customerName) {
      queryString += `&customerName=${encodeURIComponent(customerName)}`;
    }

    if (shopId) {
      queryString += `&shopId=${encodeURIComponent(shopId)}`;
    }

    if (status) {
      queryString += `&status=${encodeURIComponent(status)}`;
    }

    if (orderDate) {
      queryString += `&orderDate=${encodeURIComponent(orderDate)}`;
    }

    if (deliveryDate) {
      queryString += `&deliveryDate=${encodeURIComponent(deliveryDate)}`;
    }

    return this.http.get<ResultPaged<Order>>(queryString);
  }

  listOrdersLate(
    paginationParams: PaginationParams,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
    orderDate?: string,
    deliveryDate?: string,
  ): Observable<ResultPaged<Order>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/late?page=${page}&limit=${limit}`;

    if (customerName) {
      queryString += `&customerName=${encodeURIComponent(customerName)}`;
    }

    if (shopId) {
      queryString += `&shopId=${encodeURIComponent(shopId)}`;
    }

    if (status) {
      queryString += `&status=${encodeURIComponent(status)}`;
    }

    if (orderDate) {
      queryString += `&orderDate=${encodeURIComponent(orderDate)}`;
    }

    if (deliveryDate) {
      queryString += `&deliveryDate=${encodeURIComponent(deliveryDate)}`;
    }

    return this.http.get<ResultPaged<Order>>(queryString);
  }

  listOrdersTodayToPrepare(
    paginationParams: PaginationParams,
    customerName?: string,
    shopId?: string,
  ): Observable<ResultPaged<Order>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/today/to-prepare?page=${page}&limit=${limit}`;

    if (customerName) {
      queryString += `&customerName=${encodeURIComponent(customerName)}`;
    }

    if (shopId) {
      queryString += `&shopId=${encodeURIComponent(shopId)}`;
    }

    return this.http.get<ResultPaged<Order>>(queryString);
  }

  listOrdersTodayToDeliver(
    paginationParams: PaginationParams,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
  ): Observable<ResultPaged<Order>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/today/to-deliver?page=${page}&limit=${limit}`;

    if (customerName) {
      queryString += `&customerName=${encodeURIComponent(customerName)}`;
    }

    if (shopId) {
      queryString += `&shopId=${encodeURIComponent(shopId)}`;
    }

    if (status) {
      queryString += `&status=${encodeURIComponent(status)}`;
    }

    return this.http.get<ResultPaged<Order>>(queryString);
  }

  // item endpoints are only used to count order lines: the `total` of the paged result
  listOrderItemsTodayToPrepare(paginationParams: PaginationParams): Observable<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItemsFrom('items/today/to-prepare', paginationParams);
  }

  listOrderItemsTodayToDeliver(paginationParams: PaginationParams): Observable<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItemsFrom('items/today/to-deliver', paginationParams);
  }

  listOrderItemsToPrepare(paginationParams: PaginationParams): Observable<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItemsFrom('items/to-prepare', paginationParams);
  }

  listOrderItemsToDeliver(paginationParams: PaginationParams): Observable<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItemsFrom('items/to-deliver', paginationParams);
  }

  listOrderItemsLate(paginationParams: PaginationParams): Observable<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItemsFrom('items/late', paginationParams);
  }

  private listOrderItemsFrom(
    path: string,
    paginationParams: PaginationParams,
  ): Observable<ResultPaged<OrderItemRowDto>> {
    const { page = 1, limit = 20 } = paginationParams;
    return this.http.get<ResultPaged<OrderItemRowDto>>(
      `${this.apiUrl}/${path}?page=${page}&limit=${limit}`,
    );
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  updateOrder(id: string, order: UpdateOrderDto): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}`, order);
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}/status`, { status });
  }

  deliverOrder(id: string, paymentMethodId: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}/deliver`, { paymentMethodId });
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
