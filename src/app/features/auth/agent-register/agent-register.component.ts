import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/api/auth.service';
import { AgentRegistrationData } from '../../../core/services/api/auth.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../shared/iran-locations';

/** صفحه ثبت‌نام پیک شهری برای پیوستن به شبکه توزیع تولیدی. */
@Component({
  selector: 'app-agent-register',
  templateUrl: './agent-register.component.html',
  styleUrls: ['./agent-register.component.scss']
})
export class AgentRegisterComponent {
  form: FormGroup;
  currentStep = 1;
  readonly totalSteps = 4;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  readonly cities = IRAN_CITY_NAMES;
  readonly provinces = IRAN_PROVINCE_NAMES;

  readonly vehicleTypes = ['موتورسیکلت', 'خودرو سواری', 'وانت', 'کامیونت'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      nationalId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', Validators.required],
      province: ['', Validators.required],
      vehicleType: ['', Validators.required],
      vehiclePlate: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
      maxConcurrentOrders: [5, [Validators.required, Validators.min(1), Validators.max(100)]],
      terms: [false, Validators.requiredTrue]
    });
  }

  /** حرکت به مرحله بعد پس از اعتبارسنجی مرحله فعلی. */
  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.touchStep(this.currentStep);
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  /** بازگشت به مرحله قبل. */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /** بررسی اعتبار فیلدهای مرحله. */
  isStepValid(step: number): boolean {
    return this.stepFields(step).every((field) => this.form.get(field)?.valid);
  }

  /** ثبت درخواست عضویت پیک شهری. */
  submit(): void {
    if (!this.isStepValid(this.currentStep) || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const value = this.form.getRawValue();
    const data: AgentRegistrationData = {
      fullName: value.fullName,
      nationalId: value.nationalId,
      phone: value.phone,
      email: value.email,
      city: value.city,
      province: value.province,
      vehicleType: value.vehicleType,
      vehiclePlate: value.vehiclePlate
    };

    this.authService.registerAgent(data).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess) {
          this.submitted = true;
          this.successMessage = 'درخواست شما ثبت شد و پس از احراز هویت با شما تماس می‌گیریم.';
        } else {
          this.errorMessage = result.errorMessage ?? 'ثبت درخواست ناموفق بود.';
        }
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message;
      }
    });
  }

  /** شروع دوباره فرم پس از ثبت موفق. */
  startAgain(): void {
    this.form.reset({ maxConcurrentOrders: 5, terms: false });
    this.currentStep = 1;
    this.submitted = false;
    this.successMessage = '';
  }

  /** نمایش راهنمای فیلد. */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  /** ورود به صفحه ورود. */
  goToLogin(): void {
    void this.router.navigate(['/auth/login']);
  }

  private stepFields(step: number): string[] {
    const fields: Record<number, string[]> = {
      1: ['fullName', 'nationalId', 'phone', 'email'],
      2: ['city', 'province'],
      3: ['vehicleType', 'vehiclePlate', 'maxConcurrentOrders'],
      4: ['terms']
    };
    return fields[step] ?? [];
  }

  private touchStep(step: number): void {
    this.stepFields(step).forEach((field) => this.form.get(field)?.markAsTouched());
  }
}
