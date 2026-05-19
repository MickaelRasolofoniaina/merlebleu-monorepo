import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _isDarkMode = signal(false);
  readonly isDarkMode = this._isDarkMode.asReadonly();

  constructor() {
    const saved = localStorage.getItem('theme');
    const isDark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this._isDarkMode.set(isDark);
    this.applyTheme(isDark);
  }

  toggleTheme(): void {
    const isDark = !this._isDarkMode();
    this._isDarkMode.set(isDark);
    this.applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  private applyTheme(isDark: boolean): void {
    this.document.documentElement.classList.toggle('dark', isDark);
  }
}
