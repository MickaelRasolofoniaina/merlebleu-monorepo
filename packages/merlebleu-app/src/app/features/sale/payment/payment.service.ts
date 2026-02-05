import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, PaymentMethod } from '@merlebleu/shared';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/payment`;

  addPaymentMethod(data: CreatePaymentMethodDto): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(this.apiUrl, data);
  }

  getAllPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(this.apiUrl);
  }

  updatePaymentMethod(id: string, data: UpdatePaymentMethodDto): Observable<PaymentMethod> {
    return this.http.put<PaymentMethod>(`${this.apiUrl}/${id}`, data);
  }

  deletePaymentMethod(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
