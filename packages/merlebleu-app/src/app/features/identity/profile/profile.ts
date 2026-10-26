import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  OrderDisplayMode,
  UpdateProfileDto,
  UserRole,
  updateProfileSchema,
} from '@merlebleu/shared';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { getUserRoleLabel } from '@shared/utils/user-role';

@Component({
  selector: 'profile',
  imports: [FormsModule, SelectButtonModule, Button, InputTextModule],
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
  protected isSavingProfile = false;
  protected getUserRoleLabel = getUserRoleLabel;

  protected nameInput = '';
  protected currentPassword = '';
  protected newPassword = '';
  protected newPasswordConfirm = '';
  protected passwordConfirmError = '';
  protected profileValidationError: ReturnType<typeof updateProfileSchema.safeParse>['error'] | null =
    null;

  protected displayModeOptions = [
    { label: 'Standard', value: OrderDisplayMode.STANDARD },
    { label: 'Pâtissier', value: OrderDisplayMode.PASTRY },
  ];

  ngOnInit(): void {
    this.userPreferencesService.getCurrentUser().subscribe((user) => {
      this.name.set(user.name);
      this.nameInput = user.name;
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

  protected getProfileFieldError(field: 'name' | 'currentPassword' | 'newPassword'): string {
    return this.profileValidationError?.issues.find((issue) => issue.path[0] === field)?.message ?? '';
  }

  protected saveProfile(): void {
    this.profileValidationError = null;
    this.passwordConfirmError = '';

    if (this.newPassword && this.newPassword !== this.newPasswordConfirm) {
      this.passwordConfirmError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const profile: UpdateProfileDto = {
      name: this.nameInput,
      currentPassword: this.currentPassword || undefined,
      newPassword: this.newPassword || undefined,
    };

    const validation = updateProfileSchema.safeParse(profile);

    if (!validation.success) {
      this.profileValidationError = validation.error;
      return;
    }

    this.isSavingProfile = true;

    this.userPreferencesService
      .updateProfile(profile)
      .pipe(
        finalize(() => {
          this.isSavingProfile = false;
        }),
      )
      .subscribe({
        next: (user) => {
          this.name.set(user.name);
          localStorage.setItem('user_name', user.name);
          this.currentPassword = '';
          this.newPassword = '';
          this.newPasswordConfirm = '';
          this.messageService.add({
            severity: 'success',
            summary: 'Profil enregistré',
            detail: 'Vos informations ont été mises à jour.',
            life: 3000,
          });
        },
      });
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
