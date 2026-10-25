import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Button } from 'primeng/button';
import { OrderDisplayMode, UserRole } from '@merlebleu/shared';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { getUserRoleLabel } from '@shared/utils/user-role';

@Component({
  selector: 'profile',
  imports: [FormsModule, SelectButtonModule, Button],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly messageService = inject(MessageService);

  protected name = signal('');
  protected email = signal('');
  protected role = signal<UserRole | undefined>(undefined);
  protected selectedDisplayMode = signal<OrderDisplayMode>(OrderDisplayMode.STANDARD);
  protected isSaving = false;
  protected getUserRoleLabel = getUserRoleLabel;

  protected displayModeOptions = [
    { label: 'Standard', value: OrderDisplayMode.STANDARD },
    { label: 'Pâtissier', value: OrderDisplayMode.PASTRY },
  ];

  ngOnInit(): void {
    this.userPreferencesService.getCurrentUser().subscribe((user) => {
      this.name.set(user.name);
      this.email.set(user.email);
      this.role.set(user.role);
      this.selectedDisplayMode.set(user.defaultOrderDisplayMode ?? OrderDisplayMode.STANDARD);
    });
  }

  protected getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected save(): void {
    this.isSaving = true;

    this.userPreferencesService
      .updateDefaultDisplayMode(this.selectedDisplayMode())
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Préférences enregistrées',
            detail: "L'affichage par défaut a été mis à jour.",
            life: 3000,
          });
        },
      });
  }
}
