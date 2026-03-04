import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateOrderDto, UpdateOrderDto, Order, OrderStatus, PaginationParams, ResultPaged } from '@merlebleu/shared';

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
