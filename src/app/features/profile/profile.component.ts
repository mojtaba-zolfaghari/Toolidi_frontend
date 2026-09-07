import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
import { OrderService, Order } from '../../core/services/api/order.service';
import { Result, PagedList } from '../../core/models/api-response.model';
import { fadeIn, slideUp } from '../../shared/animations';
import { CartService } from '../../core/services/api/cart.service';

/** تب‌های پروفایل */
type ProfileTab = 'overview' | 'orders' | 'addresses' | 'security';

/** وضعیت سفارش به فارسی */
const ORDER_STATUS_MAP: Record<string, string> = {
  'Pending': 'در انتظار تأیید',
  'Processing': 'در حال پردازش',
  'Shipped': 'ارسال شده',
  'Delivered': 'تحویل شده',
  'Cancelled': 'لغو شده'
};

/** آیکون وضعیت سفارش */
const ORDER_STATUS_ICON: Record<string, string> = {
  'Pending': '⏳',
  'Processing': '⚙️',
  'Shipped': '🚚',
  'Delivered': '✅',
  'Cancelled': '❌'
};

/** رنگ وضعیت سفارش — کلاس BEM (استایل در SCSS با توکن‌های متریال) */
const ORDER_STATUS_COLOR: Record<string, string> = {
  'Pending': 'profile__order-badge--pending',
  'Processing': 'profile__order-badge--processing',
  'Shipped': 'profile__order-badge--shipped',
  'Delivered': 'profile__order-badge--delivered',
  'Cancelled': 'profile__order-badge--cancelled'
};

/**
 * صفحه پروفایل خریدار
 * شامل: نمای کلی، سفارشات، آدرس‌ها، امنیت
 */
@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    animations: [fadeIn, slideUp],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  addressForm: FormGroup;
  addresses: Address[] = [];
  orders: Order[] = [];
  selectedAddressId: string | null = null;

  /** تب فعال */
  activeTab: ProfileTab = 'overview';
  activeTabIndex = 0;
  /** آمار */
  totalOrders = 0;
  deliveredOrders = 0;
  pendingOrders = 0;
  totalSpent = 0;

  loading = true;
  ordersLoading = true;
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
  /** شناسه سفارش در حال سفارش مجدد */
  reorderingOrderId: string | null = null;
  reorderMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly addressService: AddressService,
    private readonly orderService: OrderService,
    private readonly cartService: CartService,
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
    this.loadOrders();
    this.loadAddresses();
  }

  /** تغییر تب فعال (API قدیمی — 今は mat-tab-group が更新する) */
  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  /** índice の変更を検知して activeTab を同期 */
  setTabFromIndex(index: number): void {
    const map: ProfileTab[] = ['overview', 'orders', 'addresses', 'security'];
    this.activeTab = map[index] ?? 'overview';
  }

  /** دریافت متن وضعیت سفارش */
  orderStatusLabel(status: string): string {
    return ORDER_STATUS_MAP[status] ?? status;
  }

  /** دریافت آیکون وضعیت سفارش */
  orderStatusIcon(status: string): string {
    return ORDER_STATUS_ICON[status] ?? '📦';
  }

  /** دریافت کلاس رنگ وضعیت سفارش (BEM — بدون کلاس ابزار Tailwind) */
  orderStatusColor(status: string): string {
    return ORDER_STATUS_COLOR[status] ?? '';
  }

  /** دریافت حرف اول نام */
  get initial(): string {
    if (this.profile?.firstName) return this.profile.firstName.charAt(0);
    if (this.profile?.username) return this.profile.username.charAt(0);
    return '?';
  }

  /** تاریخ عضویت فرمت‌شده */
  get memberSince(): string {
    if (!this.profile?.createdAt) return '';
    const d = new Date(this.profile.createdAt);
    return d.toLocaleDateString('fa-IR-u-ca-persian-nu-arabext', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ────── Profile ──────

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

  // ────── Orders ──────

  loadOrders(): void {
    this.ordersLoading = true;
    this.orderService.getOrders({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        const paged = result.data;
        this.orders = paged?.items ?? [];
        this.totalOrders = paged?.totalCount ?? this.orders.length;
        this.deliveredOrders = this.orders.filter(o => o.status === 'Delivered').length;
        this.pendingOrders = this.orders.filter(o => ['Pending', 'Processing'].includes(o.status)).length;
        this.totalSpent = this.orders
          .filter(o => o.isPaid)
          .reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
        this.ordersLoading = false;
      },
      error: (_err: Error) => {
        this.ordersLoading = false;
      }
    });
  }

  /** مبلغ فرمت‌شده */
  formatAmount(amount: number): string {
    return amount.toLocaleString('fa-IR');
  }

  /** تاریخ فرمت‌شده */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fa-IR-u-ca-persian-nu-arabext', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /** ────── سفارش مجدد ────── */

  /** آیا سفارش قابل سفارش مجدد است (تحویل شده یا لغو شده) */
  canReorder(order: Order): boolean {
    return order.status === 'Delivered' || order.status === 'Cancelled';
  }

  /** سفارش مجدد: اضافه کردن تمام آیتم‌های یک سفارش قبلی به سبد خرید */
  reorder(order: Order): void {
    if (this.reorderingOrderId) return; // در حال پردازش

    if (!order.items?.length) return;

    this.reorderingOrderId = order.id;
    this.reorderMessage = '';

    // اضافه کردن آیتم‌ها به سبد خرید به صورت پشت سر هم
    const items = order.items;
    let added = 0;
    let failed = 0;

    const addNext = (index: number): void => {
      if (index >= items.length) {
        // تمام آیتم‌ها اضافه شدند
        this.reorderingOrderId = null;
        if (added > 0) {
          this.reorderMessage = `${added} آیتم به سبد خرید اضافه شد. 🛒`;
          setTimeout(() => {
            this.router.navigate(['/cart']);
          }, 1200);
        } else {
          this.reorderMessage = 'هیچ آیتمی اضافه نشد. ممکن است محصولات دیگر موجود نباشند.';
        }
        return;
      }

      const item = items[index];
      this.cartService.addItem(item.productId, undefined, item.quantity).subscribe({
        next: (result) => {
          if (result.isSuccess) added++;
          else failed++;
          addNext(index + 1);
        },
        error: () => {
          failed++;
          addNext(index + 1);
        }
      });
    };

    addNext(0);
  }

  // ────── Password ──────

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

  // ────── Addresses ──────

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

  editAddress(address: Address): void {
    this.selectedAddressId = address.id;
    this.addressForm.patchValue(address);
    this.addressMessage = '';
    this.addressError = '';
  }

  cancelAddressEdit(): void {
    this.selectedAddressId = null;
    this.addressForm.reset({ addressType: 'Both', country: 'ایران', isDefault: false });
  }

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

  deleteAddress(address: Address): void {
    if (!window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) return;
    this.addressService.deleteAddress(address.id).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.addressMessage = 'آدرس حذف شد.';
          if (this.selectedAddressId === address.id) this.cancelAddressEdit();
          this.loadAddresses();
        } else {
          this.addressError = result.errorMessage ?? 'حذف آدرس انجام نشد.';
        }
      },
      error: (err: Error) => (this.addressError = err.message)
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.authState.clear();
      this.router.navigate(['/']);
    });
  }
}
