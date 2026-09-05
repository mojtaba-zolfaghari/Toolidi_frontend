import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/api/auth.service';
import { LocationService, Province, City } from '../../../core/services/api/location.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../shared/iran-locations';

@Component({
  selector: 'app-supplier-register',
  templateUrl: './supplier-register.component.html',
  styleUrls: ['./supplier-register.component.scss']
})
export class SupplierRegisterComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  currentStep = 1;
  totalSteps = 3;

  // Fallback static data
  staticCities = IRAN_CITY_NAMES;
  staticProvinces = IRAN_PROVINCE_NAMES;

  // Dynamic data from API
  apiProvinces: Province[] = [];
  apiCities: City[] = [];
  useApiData = false;
  loadingCities = false;
  registrationAllowed = true;
  registrationCheckMessage = '';

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
    private readonly router: Router,
    private readonly locationService: LocationService
  ) {
    this.form = this.fb.group({
      nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      companyName: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required]],
      province: ['', [Validators.required]],
      provinceId: [''],
      cityId: [''],
      phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      capacity: [100, [Validators.required, Validators.min(1)]],
      leadTimeDays: [3, [Validators.required, Validators.min(1)]],
      minOrderAmount: [0],
      acceptsReturns: [true],
      isVerified: [false]
    });
  }

  ngOnInit(): void {
    this.loadProvinces();
  }

  /** Load provinces from API */
  loadProvinces(): void {
    this.locationService.getProvinces().subscribe({
      next: (result) => {
        if (result.isSuccess && result.data && result.data.length > 0) {
          this.apiProvinces = result.data;
          this.useApiData = true;
        }
      },
      error: () => { /* fallback to static data */ }
    });
  }

  /** When province changes, load cities for that province */
  onProvinceChange(): void {
    const provinceId = this.form.get('provinceId')?.value;
    this.apiCities = [];
    this.form.patchValue({ cityId: '' });
    this.registrationAllowed = true;
    this.registrationCheckMessage = '';

    if (!provinceId) return;

    this.loadingCities = true;
    this.locationService.getCitiesByProvince(provinceId).subscribe({
      next: (result) => {
        this.apiCities = result.data ?? [];
        this.loadingCities = false;
      },
      error: () => { this.loadingCities = false; }
    });
  }

  /** When city changes, check if agent registration is allowed */
  onCityChange(): void {
    const provinceId = this.form.get('provinceId')?.value;
    const cityId = this.form.get('cityId')?.value;

    this.registrationAllowed = true;
    this.registrationCheckMessage = '';

    if (!provinceId || !cityId) return;

    this.locationService.isAgentRegistrationAvailable(provinceId, cityId).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.registrationAllowed = result.data ?? true;
          if (!this.registrationAllowed) {
            this.registrationCheckMessage = 'ثبت‌نام کارپخش در این شهر فعال نیست';
          }
        }
      },
      error: () => { this.registrationAllowed = true; }
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
