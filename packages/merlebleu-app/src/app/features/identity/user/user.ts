import { Component, OnInit, inject } from '@angular/core';
import { CreateUserDto, UpdateUserDto, UserDto } from '@merlebleu/shared';
import { UserService } from './user.service';

@Component({
  selector: 'app-user',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User implements OnInit {
  private readonly userService = inject(UserService);
  users: UserDto[] = [];
  lastSuccessMessage: string | null = null;
  lastErrorMessage: string | null = null;

  ngOnInit(): void {
    this.getAllUsers();
  }

  createUser(data: CreateUserDto): void {
    this.userService.createUser(data).subscribe({
      next: (createdUser) => {
        this.users = [...this.users, createdUser];
        this.lastSuccessMessage = 'User created successfully.';
        this.lastErrorMessage = null;
      },
      error: () => {
        this.lastErrorMessage = 'Failed to create user.';
        this.lastSuccessMessage = null;
      },
    });
  }

  updateUser(id: string, data: UpdateUserDto): void {
    this.userService.updateUser(id, data).subscribe({
      next: (updatedUser) => {
        this.users = this.users.map((user) => (user.id === updatedUser.id ? updatedUser : user));
        this.lastSuccessMessage = 'User updated successfully.';
        this.lastErrorMessage = null;
      },
      error: () => {
        this.lastErrorMessage = 'Failed to update user.';
        this.lastSuccessMessage = null;
      },
    });
  }

  deleteUser(id: string): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter((user) => user.id !== id);
        this.lastSuccessMessage = 'User deleted successfully.';
        this.lastErrorMessage = null;
      },
      error: () => {
        this.lastErrorMessage = 'Failed to delete user.';
        this.lastSuccessMessage = null;
      },
    });
  }

  getAllUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.lastSuccessMessage = 'Users loaded successfully.';
        this.lastErrorMessage = null;
      },
      error: () => {
        this.lastErrorMessage = 'Failed to load users.';
        this.lastSuccessMessage = null;
      },
    });
  }
}
