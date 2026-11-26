import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CashCount,
  CreateCashCountDto,
  CreateRefundDto,
  CreateTransferDto,
  ExportMovementsQueryDto,
  ListMovementsQueryDto,
  MovementPage,
  ReceiptQueryDto,
  ReceiptSummary,
  UpdateWalletDto,
  WalletSummary,
} from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

const toParams = (query: Record<string, string | number | undefined>): HttpParams => {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params = params.set(key, value);
  }
  return params;
};

@Injectable({ providedIn: 'root' })
export class TreasuryApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/treasury`;

  getWallets(): Observable<WalletSummary> {
    return this.http.get<WalletSummary>(`${this.url}/wallets`);
  }

  updateWallet(id: string, dto: UpdateWalletDto): Observable<void> {
    return this.http.put<void>(`${this.url}/wallets/${id}`, dto);
  }

  listMovements(query: Partial<ListMovementsQueryDto>): Observable<MovementPage> {
    return this.http.get<MovementPage>(`${this.url}/movements`, { params: toParams(query) });
  }

  exportMovements(query: Partial<ExportMovementsQueryDto>): Observable<Blob> {
    return this.http.get(`${this.url}/movements/export`, {
      params: toParams(query),
      responseType: 'blob',
    });
  }

  getReceipts(query: ReceiptQueryDto): Observable<ReceiptSummary> {
    return this.http.get<ReceiptSummary>(`${this.url}/receipts`, { params: toParams(query) });
  }

  createTransfer(dto: CreateTransferDto): Observable<void> {
    return this.http.post<void>(`${this.url}/transfers`, dto);
  }

  createRefund(dto: CreateRefundDto): Observable<void> {
    return this.http.post<void>(`${this.url}/refunds`, dto);
  }

  listCashCounts(walletId: string): Observable<CashCount[]> {
    return this.http.get<CashCount[]>(`${this.url}/cash-counts`, { params: toParams({ walletId }) });
  }

  createCashCount(dto: CreateCashCountDto): Observable<CashCount> {
    return this.http.post<CashCount>(`${this.url}/cash-counts`, dto);
  }
}
