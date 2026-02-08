import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateUserDto, UpdateUserDto, UserDto } from '@merlebleu/shared';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/user`;

  createUser(data: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, data);
  }

  updateUser(id: string, data: UpdateUserDto): Observable<UserDto> {
    return this.http.patch<UserDto>(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }
}
