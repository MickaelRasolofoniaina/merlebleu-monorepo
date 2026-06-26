import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shop, CreateShopDto, UpdateShopDto } from '@merlebleu/shared';
import { environment } from '@env/environment';

@Injectable()
export class ShopService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/shop`;

  getAll(): Observable<Shop[]> {
    return this.http.get<Shop[]>(this.apiUrl);
  }

  create(dto: CreateShopDto): Observable<Shop> {
    return this.http.post<Shop>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateShopDto): Observable<Shop> {
    return this.http.put<Shop>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
