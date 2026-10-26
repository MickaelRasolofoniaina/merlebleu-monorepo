import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  DashboardAmount,
  DashboardCountPoint,
  DashboardDistributionPoint,
  DashboardQueryDto,
} from '@merlebleu/shared';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`;

  getOrdersCount(query: DashboardQueryDto): Observable<DashboardCountPoint[]> {
    return this.http.get<DashboardCountPoint[]>(`${this.apiUrl}/orders-count`, {
      params: this.toParams(query),
    });
  }

  getOrdersByType(query: DashboardQueryDto): Observable<DashboardDistributionPoint[]> {
    return this.http.get<DashboardDistributionPoint[]>(`${this.apiUrl}/orders-by-type`, {
      params: this.toParams(query),
    });
  }

  getOrdersByShape(query: DashboardQueryDto): Observable<DashboardDistributionPoint[]> {
    return this.http.get<DashboardDistributionPoint[]>(`${this.apiUrl}/orders-by-shape`, {
      params: this.toParams(query),
    });
  }

  getOrdersAmount(query: DashboardQueryDto): Observable<DashboardAmount> {
    return this.http.get<DashboardAmount>(`${this.apiUrl}/orders-amount`, {
      params: this.toParams(query),
    });
  }

  private toParams(query: DashboardQueryDto): HttpParams {
    let params = new HttpParams().set('view', query.view).set('year', query.year);

    if (query.month !== undefined) {
      params = params.set('month', query.month);
    }

    return params;
  }
}
