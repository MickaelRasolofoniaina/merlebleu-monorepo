import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Notification, NotificationDto, ResultPaged } from '@merlebleu/shared';
import { environment } from '@env/environment';

const RECENT_LIMIT = 5;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/notification`;
  private eventSource: EventSource | null = null;
  private audioContext: AudioContext | null = null;

  readonly unreadCount = signal(0);
  readonly recent = signal<NotificationDto[]>([]);

  connect(): void {
    if (this.eventSource) {
      return;
    }

    this.eventSource = new EventSource(`${this.apiUrl}/stream`, {
      withCredentials: true,
    });

    this.eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data) as Notification;
      const dto: NotificationDto = { ...notification, isRead: false };

      this.recent.update((list) => [dto, ...list].slice(0, RECENT_LIMIT));
      this.unreadCount.update((count) => count + 1);
      this.playNotificationSound();
    };
  }

  private playNotificationSound(): void {
    try {
      this.audioContext ??= new AudioContext();

      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback is best-effort; never block notification delivery.
    }
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  loadRecent(): void {
    this.http
      .get<NotificationDto[]>(`${this.apiUrl}/recent?limit=${RECENT_LIMIT}`)
      .subscribe((notifications) => this.recent.set(notifications));
  }

  loadPaginated(
    page: number,
    limit: number,
  ): Observable<ResultPaged<NotificationDto>> {
    return this.http.get<ResultPaged<NotificationDto>>(
      `${this.apiUrl}?page=${page}&limit=${limit}`,
    );
  }

  refreshUnreadCount(): void {
    this.http
      .get<number>(`${this.apiUrl}/unread-count`)
      .subscribe((count) => this.unreadCount.set(count));
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.recent.update((list) =>
          list.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
        this.refreshUnreadCount();
      }),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.recent.update((list) =>
          list.map((notification) => ({ ...notification, isRead: true })),
        );
        this.unreadCount.set(0);
      }),
    );
  }
}
