import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, RegisterCustomerData, RegisterSellerData } from '../../../core/services/api/auth.service';

/**
 * کامپوننت ثبت‌نام؛ با انتخاب نوع حساب (مشتری/فروشنده)،
 * کاربر را در سرویس AuthService ثبت می‌کند و در موفقیت به صفحه ورود هدایت می‌شود.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  isSeller = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  /** تغییر نوع حساب بین مشتری و فروشنده */
  setRole(isSeller: boolean): void {
    this.isSeller = isSeller;
  }

  /** ارسال فرم ثبت‌نام */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.errorMessage = 'رمز عبور و تکرار آن یکسان نیستند.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: RegisterCustomerData | RegisterSellerData = {
      nationalCode: this.form.value.nationalCode,
      username: this.form.value.username,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword
    };

    const request = this.isSeller
      ? this.authService.registerSeller(data as RegisterSellerData)
      : this.authService.registerCustomer(data as RegisterCustomerData);

    request.subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess) {
          this.successMessage = 'ثبت‌نام با موفقیت انجام شد. اکنون می‌توانید وارد شوید.';
          setTimeout(() => this.router.navigate(['/login']), 1200);
        } else {
          this.errorMessage = result.errorMessage ?? 'ثبت‌نام ناموفق بود؛ لطفاً دوباره تلاش کنید.';
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'خطا در ارتباط با سرور';
      }
    });
  }
}
