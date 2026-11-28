import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateStockEntriesDto,
  ResultPaged,
  StockEntry,
  UpdateStockEntryDto,
} from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

@Injectable()
export class StockEntryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/stock-entry`;

  getStockEntries(
    filters: { entryDate?: string; labelContains?: string },
    page: number,
    pageSize: number,
  ): Observable<{ items: StockEntry[]; total: number }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (filters.entryDate) params.set('entryDate', filters.entryDate);
    if (filters.labelContains) params.set('labelContains', filters.labelContains);

    return this.http
      .get<ResultPaged<StockEntry>>(`${this.apiUrl}?${params.toString()}`)
      .pipe(map(({ data, total }) => ({ items: data, total })));
  }

  addStockEntries(dto: CreateStockEntriesDto): Observable<StockEntry[]> {
    return this.http.post<StockEntry[]>(this.apiUrl, dto);
  }

  editStockEntry(id: string, dto: UpdateStockEntryDto): Observable<StockEntry> {
    return this.http.put<StockEntry>(`${this.apiUrl}/${id}`, dto);
  }

  deleteStockEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
