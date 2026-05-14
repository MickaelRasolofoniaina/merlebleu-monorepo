import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateIngredientPurchaseDto,
  IngredientPurchase,
  ResultPaged,
  UpdateIngredientPurchaseDto,
} from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class IngredientPurchaseService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ingredient-purchase`;

  getPurchases(
    filters: { purchaseDate?: string; labelContains?: string; categoryId?: string },
    page: number,
    pageSize: number,
  ): Observable<{ items: IngredientPurchase[]; total: number }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (filters.purchaseDate) params.set('purchaseDate', filters.purchaseDate);
    if (filters.labelContains) params.set('labelContains', filters.labelContains);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);

    return this.http
      .get<ResultPaged<IngredientPurchase>>(`${this.apiUrl}?${params.toString()}`)
      .pipe(map(({ data, total }) => ({ items: data, total })));
  }

  addPurchase(dto: CreateIngredientPurchaseDto): Observable<IngredientPurchase> {
    return this.http.post<IngredientPurchase>(this.apiUrl, dto);
  }

  editPurchase(id: string, dto: UpdateIngredientPurchaseDto): Observable<IngredientPurchase> {
    return this.http.put<IngredientPurchase>(`${this.apiUrl}/${id}`, dto);
  }

  deletePurchase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
