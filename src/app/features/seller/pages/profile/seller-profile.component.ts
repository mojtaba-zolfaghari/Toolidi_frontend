import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SellerService } from '../../../../core/services/api/seller.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../../shared/iran-locations';

@Component({
  selector: 'app-seller-profile',
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-2xl font-extrabold text-secondary">پروفایل فروشنده 👤</h1>
        <p class="text-gray-500 mt-1">اطلاعات فروشگاه و حساب کاربری خود را مدیریت کنید</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Summary -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-3xl text-white font-bold mx-auto mb-4">
            {{ profile.companyName.charAt(0) || '🏪' }}
          </div>
          <h2 class="font-bold text-secondary text-lg">{{ profile.companyName }}</h2>
          <p class="text-gray-500 text-sm mt-1">{{ profile.city }}، {{ profile.province }}</p>
          <div class="flex items-center justify-center gap-1 mt-2">
            <span class="text-yellow-500">⭐</span>
            <span class="font-bold text-secondary">{{ profile.rating }}</span>
            <span class="text-gray-400 text-sm">({{ profile.reviewCount }} نظر)</span>
          </div>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
              <span class="text-gray-500">محصولات</span>
              <span class="font-bold text-secondary">{{ profile.totalProducts }}</span>
            </div>
            <div class="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
              <span class="text-gray-500">فروش کل</span>
              <span class="font-bold text-green-600">{{ formatCurrency(profile.totalSales) }}</span>
            </div>
            <div class="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
              <span class="text-gray-500">وضعیت</span>
              <span [class]="profile.isVerified ? 'text-green-600 font-bold' : 'text-yellow-600'">
                {{ profile.isVerified ? '✓ تأیید شده' : 'در انتظار تأیید' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 class="font-bold text-secondary mb-6">ویرایش اطلاعات فروشگاه</h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">نام فروشگاه</label>
                <input type="text" formControlName="companyName" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">نام تماس</label>
                <input type="text" formControlName="contactName" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">شماره موبایل</label>
                <input type="tel" formControlName="phone" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">ایمیل</label>
                <input type="email" formControlName="email" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">شهر</label>
                <select formControlName="city" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
                </select>
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">استان</label>
                <select formControlName="province" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option *ngFor="let p of provinces" [value]="p">{{ p }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-secondary font-medium mb-1 text-sm">آدرس فروشگاه</label>
              <input type="text" formControlName="address" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label class="block text-secondary font-medium mb-1 text-sm">درباره فروشگاه</label>
              <textarea formControlName="description" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"></textarea>
            </div>

            <!-- حداقل سفارش -->
            <div class="border-t border-gray-100 pt-4 mt-2">
              <h3 class="font-bold text-secondary text-sm mb-3 flex items-center gap-2">
                📦 شرایط حداقل سفارش
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-secondary font-medium mb-1 text-sm">حداقل مبلغ سفارش (تومان)</label>
                  <input type="number" formControlName="minimumOrderAmount" min="0"
                         class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                         placeholder="مثلاً ۵۰۰,۰۰۰" />
                  <p class="text-xs text-gray-400 mt-1">اگر ۰ بگذارید محدودیتی نیست</p>
                </div>
                <div>
                  <label class="block text-secondary font-medium mb-1 text-sm">حداقل تعداد سفارش</label>
                  <input type="number" formControlName="minimumOrderQuantity" min="0"
                         class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                         placeholder="مثلاً ۱۰" />
                  <p class="text-xs text-gray-400 mt-1">اگر ۰ بگذارید محدودیتی نیست</p>
                </div>
              </div>
            </div>

            <div *ngIf="successMessage" class="bg-green-50 text-green-600 rounded-xl px-4 py-3 text-sm">✅ {{ successMessage }}</div>
            <div *ngIf="errorMessage" class="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">⚠️ {{ errorMessage }}</div>

            <button type="submit" class="bg-primary text-white font-bold rounded-xl px-6 py-2.5 hover:bg-primary-dark transition-colors">
              ذخیره تغییرات
            </button>
          </form>
        </div>
      </div>
    </section>
  `
})
export class SellerProfileComponent implements OnInit {
  form!: FormGroup;
  successMessage = '';
  errorMessage = '';

  profile = {
    companyName: 'طلای زرین تهران',
    contactName: 'علی احمدی',
    city: 'تهران',
    province: 'تهران',
    rating: 4.5,
    reviewCount: 89,
    totalProducts: 24,
    totalSales: 125000000,
    isVerified: true
  };

  cities = IRAN_CITY_NAMES;
  provinces = IRAN_PROVINCE_NAMES;

  constructor(private readonly fb: FormBuilder, private readonly sellerService: SellerService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      companyName: [this.profile.companyName, Validators.required],
      contactName: [this.profile.contactName],
      phone: ['09123456789', [Validators.required]],
      email: ['seller@example.com', [Validators.required, Validators.email]],
      city: [this.profile.city],
      province: [this.profile.province],
      address: ['تهران، خیابان ولیعصر، پلاک ۱۲۳'],
      description: ['فروشنده تخصصی طلا و زیورآلات با بیش از ۱۰ سال سابقه'],
      minimumOrderAmount: [0],
      minimumOrderQuantity: [0]
    });
  }

  save(): void {
    this.sellerService.updateInfo(this.form.value).subscribe({
      next: () => {
        this.successMessage = 'اطلاعات با موفقیت ذخیره شد.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  }
}
