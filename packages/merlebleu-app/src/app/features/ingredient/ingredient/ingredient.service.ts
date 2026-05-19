import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateIngredientDto, Ingredient, ResultPaged, UpdateIngredientDto } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class IngredientService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ingredient`;

  getIngredients(
    filters: { labelContains?: string; categoryId?: string; unitId?: string },
    page: number,
    pageSize: number,
  ): Observable<{ items: Ingredient[]; total: number }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (filters.labelContains) params.set('labelContains', filters.labelContains);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.unitId) params.set('unitId', filters.unitId);

    return this.http
      .get<ResultPaged<Ingredient>>(`${this.apiUrl}?${params.toString()}`)
      .pipe(map(({ data, total }) => ({ items: data, total })));
  }

  addIngredient(dto: CreateIngredientDto): Observable<Ingredient> {
    return this.http.post<Ingredient>(this.apiUrl, dto);
  }

  editIngredient(id: string, dto: UpdateIngredientDto): Observable<Ingredient> {
    return this.http.put<Ingredient>(`${this.apiUrl}/${id}`, dto);
  }

  deleteIngredient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateIngredientStock(id: string, stock: number): Observable<Ingredient> {
    return this.http.patch<Ingredient>(`${this.apiUrl}/${id}/stock`, { stock });
  }
}
