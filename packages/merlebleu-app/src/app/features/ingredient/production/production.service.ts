import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Production, ProductionDayResult, SaveProductionDayDto } from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class ProductionService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/production`;

  getProductions(date: string): Observable<Production[]> {
    return this.http.get<Production[]>(`${this.apiUrl}?date=${date}`);
  }

  saveDay(dto: SaveProductionDayDto): Observable<ProductionDayResult> {
    return this.http.put<ProductionDayResult>(`${this.apiUrl}/day`, dto);
  }
}
