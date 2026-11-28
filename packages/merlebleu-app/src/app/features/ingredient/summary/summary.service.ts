import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IngredientMonthSummary } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class IngredientSummaryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ingredient-summary`;

  getMonthSummary(month: string): Observable<IngredientMonthSummary[]> {
    return this.http.get<IngredientMonthSummary[]>(`${this.apiUrl}?month=${month}`);
  }
}
