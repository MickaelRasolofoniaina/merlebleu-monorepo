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
  Shape,
} from '@merlebleu/shared';

export interface OrderItemRowFilters {
  customerName?: string;
  deliveryDate?: string;
  type?: string;
  shape?: Shape;
  text?: string;
  decoration?: string;
  size?: number;
}

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

  listOrdersToDeliver(
    paginationParams: PaginationParams,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
    orderDate?: string,
    deliveryDate?: string,
  ): Observable<ResultPaged<Order>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/to-deliver?page=${page}&limit=${limit}`;

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

  listOrderItems(
    paginationParams: PaginationParams,
    filters?: OrderItemRowFilters,
  ): Observable<ResultPaged<OrderItemRowDto>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/items?page=${page}&limit=${limit}`;

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryString += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }

    return this.http.get<ResultPaged<OrderItemRowDto>>(queryString);
  }

  listOrderItemsToPrepare(
    paginationParams: PaginationParams,
    filters?: OrderItemRowFilters,
  ): Observable<ResultPaged<OrderItemRowDto>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/items/to-prepare?page=${page}&limit=${limit}`;

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryString += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }

    return this.http.get<ResultPaged<OrderItemRowDto>>(queryString);
  }

  listOrderItemsToDeliver(
    paginationParams: PaginationParams,
    filters?: OrderItemRowFilters,
  ): Observable<ResultPaged<OrderItemRowDto>> {
    const { page = 1, limit = 20 } = paginationParams;
    let queryString = `${this.apiUrl}/items/to-deliver?page=${page}&limit=${limit}`;

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryString += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }

    return this.http.get<ResultPaged<OrderItemRowDto>>(queryString);
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

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
