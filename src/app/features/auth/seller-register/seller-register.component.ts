import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/api/auth.service';
import { LocationService, Province, City } from '../../../core/services/api/location.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../shared/iran-locations';
import { RegistrationUxService } from '../register/registration-ux.service';

/**
 * TODO(task: TASK-FE-REGISTRATION-UX-INCOMPLETE)
 * صفحه ثبت‌نام اختصاصی فروشنده برای شروع فروش در شبکه تولیدی.
 *
 * - اسکرول به مرحله/فیلد نامعتبر (acceptance criteria 1)
 * - onbeforeunload warning (acceptance criteria 4)
 * - Persian RTL preserved
 */
@Component({
  selector: 'app-seller-register',
  templateUrl: './seller-register.component.html',
  styleUrls: ['./seller-register.component.scss']
})
export class SellerRegisterComponent implements OnInit, OnDestroy {
  form: FormGroup;
  currentStep = 1;
  readonly totalSteps = 4;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  // Fallback static data (used if API fails)
  readonly staticCities = IRAN_CITY_NAMES;
  readonly staticProvinces = IRAN_PROVINCE_NAMES;

  // Dynamic data from API
  apiProvinces: Province[] = [];
  apiCities: City[] = [];
  useApiData = false;
  registrationAllowed = true;
  registrationCheckMessage = '';
  loadingCities = false;

  readonly categories = [
    'زیورآلات و بدلیجات', 'سنگ‌های قیمتی', 'ابزار و تجهیزات معدن',
    'لباس و پوشاک', 'لوازم آرایشی و بهداشتی', 'صنایع پلاستیکی', 'سایر'
  ];

  @ViewChild('stepContainer') stepContainer!: ElementRef;

  private readonly UNSAVED_MESSAGE = 'شما تغییرات ذخیره‌نشده‌ای دارید. آیا می‌خواهید از این صفحه خارج شوید؟';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly locationService: LocationService,
    private readonly ux: RegistrationUxService
  ) {
    this.form = this.fb.group({
      nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
      city: [''],
      province: [''],
      provinceId: ['', Validators.required],
      cityId: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      acceptsReturns: [true],
      terms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.loadProvinces();
    this.ux.enableUnsavedWarning(this.UNSAVED_MESSAGE);
  }

  ngOnDestroy(): void {
    this.ux.disableUnsavedWarning();
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
    this.form.patchValue({ cityId: '', city: '' });
    this.registrationAllowed = true;
    this.registrationCheckMessage = '';

    if (!provinceId) return;

    this.loadingCities = true;
    this.locationService.getCitiesByProvince(provinceId).subscribe({
      next: (result) => {
        this.apiCities = result.data ?? [];
        this.form.get('cityId')?.enable({ emitEvent: false });
        this.loadingCities = false;
      },
      error: () => { this.loadingCities = false; }
    });
  }

  /** When city changes, check if registration is allowed */
  onCityChange(): void {
    const provinceId = this.form.get('provinceId')?.value;
    const cityId = this.form.get('cityId')?.value;
    const city = this.apiCities.find(item => String(item.id) === String(cityId));
    const province = this.apiProvinces.find(item => String(item.id) === String(provinceId));
    this.form.patchValue({ city: city?.name ?? '', province: province?.name ?? '' }, { emitEvent: false });

    this.registrationAllowed = true;
    this.registrationCheckMessage = '';

    if (!provinceId || !cityId) return;

    this.locationService.isSupplierRegistrationAvailable(provinceId, cityId).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.registrationAllowed = result.data ?? true;
          if (!this.registrationAllowed) {
            this.registrationCheckMessage = 'ثبت‌نام فروشنده در این شهر فعال نیست';
          }
        }
      },
      error: () => { this.registrationAllowed = true; }
    });
  }

  /** رفتن به مرحله بعد پس از اعتبارسنجی مرحله فعلی. */
  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.touchStep(this.currentStep);
      this.ux.scrollToFirstInvalid(this.form, this.stepContainer.nativeElement);
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
      this.ux.scrollToFirstInvalid(this.form, this.stepContainer.nativeElement);
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
      2: ['companyName', 'provinceId', 'cityId', 'phone', 'email'],
      3: ['category', 'description'],
      4: ['terms']
    };
    return fields[step] ?? [];
  }

  private touchStep(step: number): void {
    this.stepFields(step).forEach((field) => this.form.get(field)?.markAsTouched());
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.touched) {
      event.preventDefault();
      event.returnValue = this.UNSAVED_MESSAGE;
    }
  }
}
