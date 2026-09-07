import { Component, HostListener, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/api/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { getCurrentRole, navigateAfterLogin } from '../../../core/utils/auth-redirect.util';
import { RegistrationUxService } from './registration-ux.service';
import { BuyerProfileApiService, BuyerProfileSubmitData } from './buyer-profile-api.service';

/**
 * TODO(task: TASK-FE-REGISTER-BUYER-ENHANCE)
 * صفحه ثبت‌نام سریع خریدار با حداقل اطلاعات موردنیاز.
 *
 * بهبودهای این تسک:
 * - فیلدهای اختیاری: شماره موبایل، آدرس پستی
 * - ارسال پروفایل به POST /api/v1/buyers/profile (stub تا بک‌اند حاضر باشد)
 * - وضعیت «تأیید خودکار» پس از submit
 * - Angular Material + BEM، بدون Tailwind
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  automaticVerificationNotice = '';

  @ViewChild('formElement') formElement!: ElementRef;

  private readonly UNSAVED_MESSAGE = 'شما تغییرات ذخیره‌نشده‌ای دارید. آیا می‌خواهید از این صفحه خارج شوید؟';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly authState: AuthStateService,
    private readonly router: Router,
    private readonly ux: RegistrationUxService,
    private readonly buyerProfileApi: BuyerProfileApiService
  ) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.pattern(/^(?:09\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      mobile: [''],
      postalAddress: ['']
    });
  }

  ngOnInit(): void {
    this.ux.enableUnsavedWarning(this.UNSAVED_MESSAGE);
  }

  ngOnDestroy(): void {
    this.ux.disableUnsavedWarning();
  }

  /** ارسال فرم ثبت‌نام سریع + پروفایل خریدار */
  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      this.ux.scrollToFirstInvalid(this.form, this.formElement.nativeElement);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.automaticVerificationNotice = '';

    this.authService.quickRegisterCustomer({
      identifier: this.form.value.identifier.trim(),
      password: this.form.value.password
    }).subscribe({
      next: async (result) => {
        this.loading = false;

        if (result.isSuccess && result.data) {
          this.authState.refresh();
          this.successMessage = 'حساب شما ساخته شد؛ در حال ورون به فروشگاه هستیم.';

          // TASK-FE-REGISTER-BUYER-ENHANCE: پس از ثبت‌نام، پروفایل خریدار ارسال شود.
          await this.submitBuyerProfile();

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

  /** ارسال پروفایل خریدار به POST /api/v1/buyers/profile */
  private async submitBuyerProfile(): Promise<void> {
    const payload: BuyerProfileSubmitData = {
      nationalCode: '',
      mobile: this.form.get('mobile')?.value?.trim() ?? '',
      postalAddress: this.form.get('postalAddress')?.value?.trim() ?? ''
    };

    this.buyerProfileApi.submitProfile(payload).subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          this.automaticVerificationNotice =
            'پروفایل خریدار ارسال شد؛ تأیید خریداران خودکار است و نیازی به کد تأیید نیست.';
        }
      },
      error: () => {
        // Explicitly not fatal for buyer UX because backend endpoint is not live yet.
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.invalid && this.form.touched) {
      event.preventDefault();
      event.returnValue = this.UNSAVED_MESSAGE;
    }
  }
}
