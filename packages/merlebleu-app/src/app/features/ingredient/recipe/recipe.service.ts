import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateRecipeDto, Recipe, ResultPaged, UpdateRecipeDto } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class RecipeService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/recipe`;

  getRecipes(
    filters: { labelContains?: string; isActive?: boolean },
    page: number,
    pageSize: number,
  ): Observable<{ items: Recipe[]; total: number }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (filters.labelContains) params.set('labelContains', filters.labelContains);
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));

    return this.http
      .get<ResultPaged<Recipe>>(`${this.apiUrl}?${params.toString()}`)
      .pipe(map(({ data, total }) => ({ items: data, total })));
  }

  addRecipe(dto: CreateRecipeDto): Observable<Recipe> {
    return this.http.post<Recipe>(this.apiUrl, dto);
  }

  editRecipe(id: string, dto: UpdateRecipeDto): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.apiUrl}/${id}`, dto);
  }

  archiveRecipe(id: string): Observable<Recipe> {
    return this.http.patch<Recipe>(`${this.apiUrl}/${id}/archive`, {});
  }

  restoreRecipe(id: string): Observable<Recipe> {
    return this.http.patch<Recipe>(`${this.apiUrl}/${id}/restore`, {});
  }

  duplicateRecipe(id: string): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.apiUrl}/${id}/duplicate`, {});
  }
}
