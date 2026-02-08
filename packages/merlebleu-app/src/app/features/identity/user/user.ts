import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FormsModule } from '@angular/forms';
import {
  createUserSchema,
  updateUserSchema,
  CreateUserDto,
  UserDto,
  UpdateUserDto,
} from '@merlebleu/shared';
import { UserService } from './user.service';

@Component({
  selector: 'app-user',
  imports: [
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    FormsModule,
  ],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User implements OnInit {
  private readonly userService = inject(UserService);
  users = signal<UserDto[]>([]);
  isLoadingUsers = false;
  displayCreateModal = false;
  displayEditModal = false;
  displayDeleteModal = false;
  createUserDto: CreateUserDto = {
    name: '',
    email: '',
    password: '',
  };
  newUserPasswordConfirm = '';
  showPassword = false;
  showPasswordConfirm = false;
  createValidationError: ReturnType<typeof createUserSchema.safeParse>['error'] | null = null;
  passwordConfirmError = '';
  editUserId: string | null = null;
  editUserDto: UpdateUserDto = {
    name: '',
    email: '',
    password: '',
  };
  editUserPasswordConfirm = '';
  showEditPassword = false;
  showEditPasswordConfirm = false;
  editValidationError: ReturnType<typeof updateUserSchema.safeParse>['error'] | null = null;
  editPasswordConfirmError = '';
  deleteUserId: string | null = null;
  deleteUserName = '';

  ngOnInit(): void {
    this.getAllUsers();
  }

  createUser(data: CreateUserDto): void {
    this.userService.createUser(data).subscribe({
      next: (createdUser) => {
        this.users.update((current) => [...current, createdUser]);
      },
    });
  }

  openCreateUserModal(): void {
    this.resetCreateForm();
    this.displayCreateModal = true;
  }

  confirmCreateUser(): void {
    this.createValidationError = null;
    this.passwordConfirmError = '';

    if (this.createUserDto.password !== this.newUserPasswordConfirm) {
      this.passwordConfirmError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const validation = createUserSchema.safeParse(this.createUserDto);

    if (!validation.success) {
      this.createValidationError = validation.error;
      return;
    }

    this.createUser(this.createUserDto);

    this.resetCreateForm();
    this.displayCreateModal = false;
  }

  cancelCreateUser(): void {
    this.resetCreateForm();
    this.displayCreateModal = false;
  }

  private resetCreateForm(): void {
    this.createUserDto = {
      name: '',
      email: '',
      password: '',
    };
    this.newUserPasswordConfirm = '';
    this.showPassword = false;
    this.showPasswordConfirm = false;
    this.createValidationError = null;
    this.passwordConfirmError = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmVisibility(): void {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }

  toggleEditPasswordVisibility(): void {
    this.showEditPassword = !this.showEditPassword;
  }

  toggleEditPasswordConfirmVisibility(): void {
    this.showEditPasswordConfirm = !this.showEditPasswordConfirm;
  }

  openEditUserModal(user: UserDto): void {
    this.resetEditForm();
    this.editUserId = user.id;
    this.editUserDto = {
      name: user.name,
      email: user.email,
      password: '',
    };
    this.displayEditModal = true;
  }

  confirmEditUser(): void {
    this.editValidationError = null;
    this.editPasswordConfirmError = '';

    if (this.editUserDto.password !== this.editUserPasswordConfirm) {
      this.editPasswordConfirmError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.editUserId) {
      return;
    }

    const validation = updateUserSchema.safeParse(this.editUserDto);

    if (!validation.success) {
      this.editValidationError = validation.error;
      return;
    }

    this.updateUser(this.editUserId, this.editUserDto);

    this.resetEditForm();
    this.displayEditModal = false;
  }

  cancelEditUser(): void {
    this.resetEditForm();
    this.displayEditModal = false;
  }

  openDeleteUserModal(user: UserDto): void {
    this.deleteUserId = user.id;
    this.deleteUserName = user.name;
    this.displayDeleteModal = true;
  }

  confirmDeleteUser(): void {
    if (!this.deleteUserId) {
      return;
    }

    this.deleteUser(this.deleteUserId);
    this.resetDeleteState();
    this.displayDeleteModal = false;
  }

  cancelDeleteUser(): void {
    this.resetDeleteState();
    this.displayDeleteModal = false;
  }

  private resetDeleteState(): void {
    this.deleteUserId = null;
    this.deleteUserName = '';
  }

  private resetEditForm(): void {
    this.editUserId = null;
    this.editUserDto = {
      name: '',
      email: '',
      password: '',
    };
    this.editUserPasswordConfirm = '';
    this.showEditPassword = false;
    this.showEditPasswordConfirm = false;
    this.editValidationError = null;
    this.editPasswordConfirmError = '';
  }

  getCreateFieldError(field: 'name' | 'email' | 'password'): string {
    return (
      this.createValidationError?.issues.find((issue) => issue.path[0] === field)?.message ?? ''
    );
  }

  getEditFieldError(field: 'name' | 'email' | 'password'): string {
    return this.editValidationError?.issues.find((issue) => issue.path[0] === field)?.message ?? '';
  }

  updateUser(id: string, data: UpdateUserDto): void {
    this.userService.updateUser(id, data).subscribe({
      next: (updatedUser) => {
        this.users.update((current) =>
          current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
        );
      },
    });
  }

  deleteUser(id: string): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.users.update((current) => current.filter((user) => user.id !== id));
      },
    });
  }

  getAllUsers(): void {
    this.isLoadingUsers = true;
    this.userService
      .getAllUsers()
      .pipe(
        finalize(() => {
          this.isLoadingUsers = false;
        }),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
        },
      });
  }
}
