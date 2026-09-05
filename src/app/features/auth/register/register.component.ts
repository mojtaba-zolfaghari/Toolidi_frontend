import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/api/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { getCurrentRole, navigateAfterLogin } from '../../../core/utils/auth-redirect.util';

/**
 * صفحه ثبت‌نام سریع خریدار با حداقل اطلاعات موردنیاز.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly authState: AuthStateService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.pattern(/^(?:09\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /** ارسال فرم ثبت‌نام سریع */
  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.quickRegisterCustomer({
      identifier: this.form.value.identifier.trim(),
      password: this.form.value.password
    }).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess && result.data) {
          this.authState.refresh();
          this.successMessage = 'حساب شما ساخته شد؛ در حال ورود به فروشگاه هستیم.';
          setTimeout(() => navigateAfterLogin(this.router, getCurrentRole()), 700);
        } else {
          this.errorMessage = result.errorMessage ?? 'ثبت‌نام ناموفق بود؛ دوباره تلاش کنید.';
        }
      },
      error: (err: { error?: { errorMessage?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.errorMessage ?? err?.message ?? 'خطا در ارتباط با سرور';
      }
    });
  }
}
