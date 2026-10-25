import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateItemDto, Item, ItemType, ResultPaged, UpdateItemDto } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class ItemService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/item`;

  getItems(
    search: string,
    page: number,
    pageSize: number,
    type?: ItemType | null,
  ): Observable<{ items: Item[]; total: number }> {
    let url = `${this.apiUrl}?labelContains=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`;

    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }

    return this.http.get<ResultPaged<Item>>(url).pipe(
      map(({ data, total }) => ({
        items: data,
        total,
      })),
    );
  }

  getItemsByType(type: ItemType): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/type/${type}`);
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
