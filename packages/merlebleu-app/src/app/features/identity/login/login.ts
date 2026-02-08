import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { signInUserSchema, SignInUserDto } from '@merlebleu/shared';
import { LoginService } from './login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonModule, InputTextModule, InputGroupModule, InputGroupAddonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  signInUserDto: SignInUserDto = {
    email: '',
    password: '',
  };
  showPassword = false;
  signInValidationError: ReturnType<typeof signInUserSchema.safeParse>['error'] | null = null;
  loginError = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {
    this.signInValidationError = null;
    this.loginError = '';

    const validation = signInUserSchema.safeParse(this.signInUserDto);

    if (!validation.success) {
      this.signInValidationError = validation.error;
      return;
    }

    this.loginService.signIn(this.signInUserDto).subscribe({
      next: () => {
        void this.router.navigate(['/identity/user']);
      },
      error: (error) => {
        if (error?.status === 401) {
          this.loginError = 'Email et/ou mot de passe incorrect.';
        }
      },
    });
  }

  getSignInFieldError(field: 'email' | 'password'): string {
    return (
      this.signInValidationError?.issues.find((issue) => issue.path[0] === field)?.message ?? ''
    );
  }
}
