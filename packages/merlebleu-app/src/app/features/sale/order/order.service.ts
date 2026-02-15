import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateOrderDto, UpdateOrderDto, Order } from '@merlebleu/shared';

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
    page = 1,
    limit = 20,
    filters?: Record<string, unknown>,
  ): Observable<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    let queryString = `${this.apiUrl}?page=${page}&limit=${limit}`;

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryString += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }

    return this.http.get<{
      data: Order[];
      total: number;
      page: number;
      limit: number;
    }>(queryString);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  updateOrder(id: string, order: UpdateOrderDto): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}`, order);
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
