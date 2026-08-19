import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AuthService,
  ChangePasswordData,
  UserProfile,
  UpdateProfileData
} from '../../core/services/api/auth.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Address, AddressData, AddressService } from '../../core/services/api/address.service';
import { Result } from '../../core/models/api-response.model';

/** صفحه پروفایل کاربر و مدیریت اطلاعات حساب */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  addressForm: FormGroup;
  addresses: Address[] = [];
  selectedAddressId: string | null = null;
  loading = true;
  addressesLoading = true;
  savingAddress = false;
  savingProfile = false;
  changingPassword = false;
  errorMessage = '';
  profileMessage = '';
  passwordMessage = '';
  passwordError = '';
  addressMessage = '';
  addressError = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly addressService: AddressService,
    private readonly authState: AuthStateService,
    private readonly router: Router
  ) {
    this.profileForm = this.fb.group({
      mobileNumber: ['', [Validators.required]],
      email: ['', [Validators.email]],
      firstName: [''],
      lastName: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    });

    this.addressForm = this.fb.group({
      addressType: ['Both', [Validators.required]],
      addressLine: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['ایران', [Validators.required]],
      phoneNumber: [''],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
  }

  /** دریافت آدرس‌های کاربر جاری */
  loadAddresses(): void {
    this.addressesLoading = true;
    this.addressService.getAddresses().subscribe({
      next: (result) => {
        this.addresses = result.data ?? [];
        this.addressesLoading = false;
      },
      error: (err: Error) => {
        this.addressError = err.message;
        this.addressesLoading = false;
      }
    });
  }

  /** آماده‌سازی فرم برای ویرایش آدرس */
  editAddress(address: Address): void {
    this.selectedAddressId = address.id;
    this.addressForm.patchValue(address);
    this.addressMessage = '';
    this.addressError = '';
  }

  /** پاک‌کردن حالت ویرایش آدرس */
  cancelAddressEdit(): void {
    this.selectedAddressId = null;
    this.addressForm.reset({ addressType: 'Both', country: 'ایران', isDefault: false });
  }

  /** ذخیره آدرس جدید یا ویرایش‌شده */
  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.savingAddress = true;
    this.addressMessage = '';
    this.addressError = '';
    const data = this.addressForm.value as AddressData;
    const editingId = this.selectedAddressId;
    if (editingId) {
      this.addressService.updateAddress(editingId, data).subscribe({
        next: (result) => this.finishAddressSave(result, true),
        error: (err: Error) => this.failAddressSave(err)
      });
    } else {
      this.addressService.addAddress(data).subscribe({
        next: (result) => this.finishAddressSave(result, false),
        error: (err: Error) => this.failAddressSave(err)
      });
    }
  }

  private finishAddressSave(result: Result<unknown>, editing: boolean): void {
    this.savingAddress = false;
    if (result.isSuccess) {
      this.addressMessage = editing ? 'آدرس ویرایش شد.' : 'آدرس جدید اضافه شد.';
      this.cancelAddressEdit();
      this.loadAddresses();
    } else {
      this.addressError = result.errorMessage ?? 'ذخیره آدرس انجام نشد.';
    }
  }

  private failAddressSave(error: Error): void {
    this.savingAddress = false;
    this.addressError = error.message;
  }

  /** حذف آدرس */
  deleteAddress(address: Address): void {
    this.addressService.deleteAddress(address.id).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.addressMessage = 'آدرس حذف شد.';
          if (this.selectedAddressId === address.id) {
            this.cancelAddressEdit();
          }
          this.loadAddresses();
        } else {
          this.addressError = result.errorMessage ?? 'حذف آدرس انجام نشد.';
        }
      },
      error: (err: Error) => (this.addressError = err.message)
    });
  }

  /** دریافت اطلاعات کاربر جاری */
  loadProfile(): void {
    this.loading = true;
    this.errorMessage = '';
    this.authService.getCurrentUser().subscribe({
      next: (result) => {
        this.profile = result.data ?? null;
        if (this.profile) {
          this.profileForm.patchValue({
            mobileNumber: this.profile.mobileNumber ?? '',
            email: this.profile.email ?? '',
            firstName: this.profile.firstName ?? '',
            lastName: this.profile.lastName ?? ''
          });
        }
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  /** ذخیره اطلاعات تکمیلی پروفایل */
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    this.profileMessage = '';
    const data = this.profileForm.value as UpdateProfileData;
    this.authService.updateProfile(data).subscribe({
      next: (result) => {
        this.savingProfile = false;
        if (result.isSuccess && result.data) {
          this.profile = result.data;
          this.profileMessage = 'اطلاعات پروفایل با موفقیت ذخیره شد.';
        } else {
          this.errorMessage = result.errorMessage ?? 'ذخیره اطلاعات انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.savingProfile = false;
        this.errorMessage = err.message;
      }
    });
  }

  /** تغییر رمز عبور */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.value as ChangePasswordData;
    if (value.newPassword !== value.confirmNewPassword) {
      this.passwordError = 'رمز عبور جدید و تکرار آن یکسان نیستند.';
      return;
    }

    this.changingPassword = true;
    this.passwordError = '';
    this.passwordMessage = '';
    this.authService.changePassword(value).subscribe({
      next: (result) => {
        this.changingPassword = false;
        if (result.isSuccess) {
          this.passwordForm.reset();
          this.passwordMessage = 'رمز عبور با موفقیت تغییر کرد.';
        } else {
          this.passwordError = result.errorMessage ?? 'تغییر رمز عبور انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.changingPassword = false;
        this.passwordError = err.message;
      }
    });
  }

  /** خروج از حساب و بازگشت به صفحه اصلی */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.authState.clear();
      this.router.navigate(['/']);
    });
  }
}
