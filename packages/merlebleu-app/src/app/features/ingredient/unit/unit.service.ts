import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateIngredientUnitDto, IngredientUnit, UpdateIngredientUnitDto } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class IngredientUnitService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ingredient-unit`;

  getAll(): Observable<IngredientUnit[]> {
    return this.http.get<IngredientUnit[]>(this.apiUrl);
  }

  add(dto: CreateIngredientUnitDto): Observable<IngredientUnit> {
    return this.http.post<IngredientUnit>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateIngredientUnitDto): Observable<IngredientUnit> {
    return this.http.put<IngredientUnit>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
