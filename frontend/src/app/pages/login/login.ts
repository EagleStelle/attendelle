import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    NgIcon,
    HlmCardImports,
    HlmFieldImports,
    HlmInput,
    HlmLabel,
    HlmButton,
    HlmCheckbox,
  ],
  viewProviders: [provideIcons({ lucideEye, lucideEyeOff })],
  templateUrl: './login.html',
})
export class Login {
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);
  protected readonly rememberMe = signal(false);
  protected readonly errorMessage = signal('');

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected onSubmit(): void {
    if (!this.username() || !this.password()) {
      this.errorMessage.set('Please enter both username and password.');
      return;
    }

    this.errorMessage.set('');
    this.authService.login(this.username(), this.password()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage.set('Invalid credentials. Please try again.');
      }
    });
  }
}
