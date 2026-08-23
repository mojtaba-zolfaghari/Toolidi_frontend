import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/api/auth.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../shared/iran-locations';

@Component({
  selector: 'app-supplier-register',
  templateUrl: './supplier-register.component.html',
  styleUrls: ['./supplier-register.component.scss']
})
export class SupplierRegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  currentStep = 1;
  totalSteps = 3;

  cities = IRAN_CITY_NAMES;
  provinces = IRAN_PROVINCE_NAMES;

  categories = [
    'انگشتر نقره‌نگین', 'طلای زرد', 'طلای سفید', 'نقره‌آلات',
    'سنگ‌های قیمتی و نیمه‌قیمتی', 'ابزار و تجهیزات معدن',
    'حلقه‌های نامزدی و ازدواج', 'گردنبند و زنجیر', 'دستبند و النگو',
    'گوشواره', 'لباس و پوشاک', 'لوازم آرایشی و بهداشتی',
    'صنایع پلاستیکی', 'زیورآلات دست‌ساز', 'جواهرات عتیقه و کلکسیونی'
  ];

  selectedCategories: string[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      // Step 1: اطلاعات حساب
      nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      // Step 2: اطلاعات شرکت
      companyName: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required]],
      province: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      // Step 3: اطلاعات تجاری
      description: ['', [Validators.required, Validators.minLength(10)]],
      capacity: [100, [Validators.required, Validators.min(1)]],
      leadTimeDays: [3, [Validators.required, Validators.min(1)]],
      minOrderAmount: [0],
      acceptsReturns: [true],
      isVerified: [false]
    });
  }

  toggleCategory(cat: string): void {
    const idx = this.selectedCategories.indexOf(cat);
    if (idx > -1) {
      this.selectedCategories.splice(idx, 1);
    } else {
      this.selectedCategories.push(cat);
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    const stepFields: { [key: number]: string[] } = {
      1: ['nationalCode', 'username', 'password', 'confirmPassword'],
      2: ['companyName', 'city', 'province', 'phone', 'email'],
      3: ['description', 'capacity', 'leadTimeDays']
    };
    return stepFields[step]?.every(f => this.form.get(f)?.valid) ?? false;
  }

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

    const data = {
      nationalCode: this.form.value.nationalCode,
      username: this.form.value.username,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword
    };

    this.authService.registerSeller(data).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess) {
          this.successMessage = 'ثبت‌نام تأمین‌کننده با موفقیت انجام شد! اکنون می‌توانید وارد شوید.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
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
