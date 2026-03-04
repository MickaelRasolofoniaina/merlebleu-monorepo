import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateItemDto, Item, UpdateItemDto } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class ItemService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/item`;

  getItems(search: string, page: number, pageSize: number): Observable<{ items: Item[]; total: number }> {
    return this.http.get<{ items: Item[]; total: number }>(`${this.apiUrl}?labelContains=${search}&page=${page}&limit=${pageSize}`);
  }

  addItem(item: CreateItemDto): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, item);
  }

  editItem(id: string, item: UpdateItemDto): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${id}`, item);
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
