import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/api/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

/**
 * کامپوننت ورود کاربر؛ با دریافت کد ملی و رمز عبور،
 * از سرویس AuthService استفاده می‌کند و در صورت موفقیت به صفحه اصلی می‌رود.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly authState: AuthStateService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      nationalCode: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /** ارسال فرم ورود */
  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { nationalCode, password } = this.form.value;
    this.authService.login(nationalCode, password).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess && result.data) {
          this.authState.refresh();
          this.router.navigate(['/']);
        } else {
          this.errorMessage = result.errorMessage ?? 'ورود ناموفق بود؛ لطفاً دوباره تلاش کنید.';
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'خطا در ارتباط با سرور';
      }
    });
  }
}
