import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/api/auth.service';
import { LocationService, Province, City } from '../../../core/services/api/location.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../shared/iran-locations';
import { RegistrationUxService } from '../register/registration-ux.service';
import { DocumentUploadService } from '../register/document-upload.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * ثبتنام تأمینکننده — Material-only design (Tailwind migration complete).
 * Flow: 3 steps (حساب → شرکت/تماس → آپلود مدارک) → submit → success state.
 */
interface UploadFileState {
  file: File;
  progress: number;
  error: string;
  uploaded?: boolean;
}

@Component({
    selector: 'app-supplier-register',
    templateUrl: './supplier-register.component.html',
    styleUrls: ['./supplier-register.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SupplierRegisterComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  submitted = false;
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
    'انگشتر نقرهنگین', 'طلای زرد', 'طلای سفید', 'نقرهآلات',
    'سنگهای قیمتی و نیمهقیمتی', 'ابزار و تجهیزات معدن',
    'حلقههای نامزدی و ازدواج', 'گردنبند و زنجیر', 'دستبند و النگو',
    'گوشواره', 'لباس و پوشاک', 'لوازم آرایشی و بهداشتی',
    'صنایع پلاستیکی', 'زیورآلات دستساز', 'جواهرات عتیقه و کلکسیونی'
  ];

  selectedCategories: string[] = [];

  @ViewChild('stepContainer') stepContainer!: ElementRef;

  // Document upload state
  private readonly UNSAVED_MESSAGE = 'شما تغییرات ذخیرهنشدهای دارید. آیا میخواهید از این صفحه خارج شوید؟';
  supplierUploadedFiles: Array<{ file: File; name: string; url?: string; size?: number }> = [];
  supplierUploadingFiles: UploadFileState[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly locationService: LocationService,
    private readonly ux: RegistrationUxService,
    private readonly snackBar: MatSnackBar,
    private readonly docService: DocumentUploadService
  ) {
    this.form = this.fb.group({
      nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      companyName: ['', [Validators.required, Validators.minLength(3)]],
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
      terms: [false, [Validators.requiredTrue]]
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

  /** When city changes, check if registration is allowed */
  onCityChange(): void {
    const provinceId = this.form.get('provinceId')?.value;

    this.registrationAllowed = true;
    this.registrationCheckMessage = '';

    if (!provinceId) return;

    this.locationService.isAgentRegistrationAvailable(provinceId, '').subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.registrationAllowed = result.data ?? true;
          if (!this.registrationAllowed) {
            this.registrationCheckMessage = 'ثبتنام تأمینکننده در این شهر فعلاً فعال نیست';
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
    const stepFields: Record<number, string[]> = {
      1: ['nationalCode', 'username', 'password', 'confirmPassword'],
      2: ['companyName', 'provinceId', 'cityId', 'phone', 'email'],
      3: ['acceptsReturns']
    };
    return stepFields[step]?.every(f => this.form.get(f)?.valid) ?? false;
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.scrollToFirstInvalid();
      return;
    }

    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.errorMessage = 'رمز عبور و تکرار آن یکسان نیستند.';
      return;
    }

    if (this.supplierUploadedFiles.length === 0) {
      this.snackBar.open('حداقل یک مدارک (شناسنامه ملی، گواهی مالیاتی یا صورت‌حساب بانکی) آپلود کنید.', 'بستن', { duration: 5000 });
      this.currentStep = 3;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      nationalCode: this.form.value.nationalCode,
      username: this.form.value.username,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword,
      companyName: this.form.value.companyName,
      provinceId: this.form.value.provinceId,
      cityId: this.form.value.cityId,
      phone: this.form.value.phone,
      email: this.form.value.email,
      address: this.form.value.address,
      description: this.form.value.description,
      capacity: this.form.value.capacity,
      leadTimeDays: this.form.value.leadTimeDays,
      minOrderAmount: this.form.value.minOrderAmount,
      acceptsReturns: this.form.value.acceptsReturns,
      selectedCategories: this.selectedCategories
    };

    this.authService.registerSeller(data).subscribe({
      next: async (regResult) => {
        if (!regResult.isSuccess) {
          this.loading = false;
          this.errorMessage = regResult.errorMessage ?? 'ثبت‌نام ناموفق بود؛ لطفاً دوباره تلاش کنید.';
          return;
        }

        // آپلود مدارک روی سرور پس از دریافت توکن JWT
        await this.uploadSupplierDocuments();

        this.submitted = true;
        this.successMessage = 'ثبت‌نام تأمین‌کننده با موفقیت انجام شد. مدارک شما در حال بررسی هستند (کمتر از ۳ روز کاری). اکنون می‌توانید وارد پنل تأمین‌کننده خود شوید.';
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'خطا در ارتباط با سرور';
      }
    });
  }

  /** آپلود همه‌ی مدارک تأمینکننده روی سرور پس از ثبت‌نام. */
  private async uploadSupplierDocuments(): Promise<void> {
    for (const entry of this.supplierUploadedFiles) {
      this.docService.upload(
        entry.file,
        '/api/v1/suppliers/documents',
        { documentType: 'other' }
      ).subscribe({
        next: (uploadResult) => {
          if (!uploadResult.ok) {
            console.warn(`آپلود فایل ${entry.name} ناموفق بود: ${uploadResult.error}`);
          }
        },
        error: (err: Error) => {
          console.warn(`خطا در آپلود ${entry.name}:`, err.message);
        }
      });
    }
  }

  goToSupplierPanel(): void {
    this.router.navigate(['/auth/login']);
  }

  startAgain(): void {
    this.submitted = false;
    this.currentStep = 1;
    this.form.reset({
      acceptsReturns: true,
      capacity: 100,
      leadTimeDays: 3,
      minOrderAmount: 0
    });
    this.supplierUploadedFiles = [];
    this.supplierUploadingFiles = [];
  }

  scrollToFirstInvalid(): void {
    this.ux.scrollToFirstInvalid(this.form, this.stepContainer?.nativeElement);
  }

  // ─── Document Upload Handlers ──────────────────────────────

  onFilesSelected(files: FileList | null): void {
    if (!files) return;
    this.onSupplierFileSelected(Array.from(files));
  }

  onSupplierFileSelected(files: File[]): void {
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    const MAX_BYTES = 5 * 1024 * 1024;

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.snackBar.open(`نوع فایل "${file.name}" پذیرفته نیست (PDF، JPG یا PNG).`, 'بستن', { duration: 4000 });
        continue;
      }
      if (file.size > MAX_BYTES) {
        this.snackBar.open(`حجم فایل "${file.name}" باید کمتر از ۵ مگابایت باشد.`, 'بستن', { duration: 4000 });
        continue;
      }
      this.supplierUploadingFiles.push({ file, progress: 100, error: '' });
      this.supplierUploadedFiles.push({ file, name: file.name, size: file.size });
    }
  }

  removeUploadedFile(index: number): void {
    this.supplierUploadedFiles.splice(index, 1);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.touched) {
      event.preventDefault();
      event.returnValue = this.UNSAVED_MESSAGE;
    }
  }
}
