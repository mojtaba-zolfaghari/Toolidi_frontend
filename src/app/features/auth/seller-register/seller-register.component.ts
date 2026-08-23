import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/api/auth.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../shared/iran-locations';

/** صفحه ثبت‌نام اختصاصی فروشنده برای شروع فروش در شبکه تولیدی. */
@Component({
  selector: 'app-seller-register',
  templateUrl: './seller-register.component.html',
  styleUrls: ['./seller-register.component.scss']
})
export class SellerRegisterComponent {
  form: FormGroup;
  currentStep = 1;
  readonly totalSteps = 4;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  readonly cities = IRAN_CITY_NAMES;
  readonly provinces = IRAN_PROVINCE_NAMES;

  readonly categories = [
    'زیورآلات و بدلیجات', 'سنگ‌های قیمتی', 'ابزار و تجهیزات معدن',
    'لباس و پوشاک', 'لوازم آرایشی و بهداشتی', 'صنایع پلاستیکی', 'سایر'
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
      city: ['', Validators.required],
      province: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      acceptsReturns: [true],
      terms: [false, Validators.requiredTrue]
    });
  }

  /** رفتن به مرحله بعد پس از اعتبارسنجی مرحله فعلی. */
  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.touchStep(this.currentStep);
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  /** برگشت به مرحله قبل. */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /** اعتبارسنجی فیلدهای هر مرحله. */
  isStepValid(step: number): boolean {
    return this.stepFields(step).every((field) => this.form.get(field)?.valid);
  }

  /** ارسال اطلاعات حساب فروشنده به endpoint موجود احراز هویت. */
  submit(): void {
    this.touchStep(4);
    const value = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (value.password !== value.confirmPassword) {
      this.errorMessage = 'رمز عبور و تکرار آن یکسان نیستند.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.authService.registerSeller({
      nationalCode: value.nationalCode,
      username: value.username,
      password: value.password,
      confirmPassword: value.confirmPassword
    }).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess) {
          this.submitted = true;
          this.successMessage = 'حساب فروشنده با موفقیت ایجاد شد. اکنون می‌توانید وارد پنل فروش خود شوید.';
        } else {
          this.errorMessage = result.errorMessage ?? 'ثبت‌نام ناموفق بود؛ لطفاً دوباره تلاش کنید.';
        }
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message;
      }
    });
  }

  /** شروع دوباره فرم. */
  startAgain(): void {
    this.form.reset({ acceptsReturns: true, terms: false });
    this.currentStep = 1;
    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  /** بررسی خطای قابل نمایش یک فیلد. */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  /** رفتن به ورود. */
  goToLogin(): void {
    void this.router.navigate(['/auth/login']);
  }

  /** باز کردن پنل فروشنده بعد از ورود. */
  goToSellerPanel(): void {
    void this.router.navigate(['/seller']);
  }

  private stepFields(step: number): string[] {
    const fields: Record<number, string[]> = {
      1: ['nationalCode', 'username', 'password', 'confirmPassword'],
      2: ['companyName', 'city', 'province', 'phone', 'email'],
      3: ['category', 'description'],
      4: ['terms']
    };
    return fields[step] ?? [];
  }

  private touchStep(step: number): void {
    this.stepFields(step).forEach((field) => this.form.get(field)?.markAsTouched());
  }
}
