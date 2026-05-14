import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateIngredientCategoryDto, IngredientCategory, UpdateIngredientCategoryDto } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class IngredientCategoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ingredient-category`;

  getAll(): Observable<IngredientCategory[]> {
    return this.http.get<IngredientCategory[]>(this.apiUrl);
  }

  add(dto: CreateIngredientCategoryDto): Observable<IngredientCategory> {
    return this.http.post<IngredientCategory>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateIngredientCategoryDto): Observable<IngredientCategory> {
    return this.http.put<IngredientCategory>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
