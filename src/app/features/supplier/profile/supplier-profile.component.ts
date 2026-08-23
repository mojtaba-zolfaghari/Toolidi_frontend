import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierService } from '../../../core/services/api/supplier.service';
import { IRAN_CITY_NAMES, IRAN_PROVINCE_NAMES } from '../../../shared/iran-locations';

@Component({
  selector: 'app-supplier-profile',
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-2xl font-extrabold text-secondary">پروفایل و تنظیمات ⚙️</h1>
        <p class="text-gray-500 mt-1">اطلاعات شرکت و تنظیمات تأمین خود را مدیریت کنید</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Card -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-3xl text-white font-bold mx-auto mb-4">
            🏭
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
              <span class="text-gray-500">محصولات فعال</span>
              <span class="font-bold text-secondary">{{ profile.activeProducts }}</span>
            </div>
            <div class="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
              <span class="text-gray-500">سفارشات تکمیل</span>
              <span class="font-bold text-green-600">{{ profile.completedOrders }}</span>
            </div>
            <div class="flex justify-between bg-gray-50 rounded-lg px-4 py-2">
              <span class="text-gray-500">نرخ تحویل</span>
              <span class="font-bold text-blue-600">{{ profile.deliveryRate }}٪</span>
            </div>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 class="font-bold text-secondary mb-6">ویرایش اطلاعات شرکت</h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">نام شرکت</label>
                <input type="text" formControlName="companyName" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">شماره تماس</label>
                <input type="tel" formControlName="phone" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30" dir="ltr" />
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">ایمیل</label>
                <input type="email" formControlName="email" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30" dir="ltr" />
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">شهر</label>
                <select formControlName="city" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30">
                  <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
                </select>
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">استان</label>
                <select formControlName="province" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30">
                  <option *ngFor="let p of provinces" [value]="p">{{ p }}</option>
                </select>
              </div>
              <div>
                <label class="block text-secondary font-medium mb-1 text-sm">زمان آماده‌سازی (روز)</label>
                <input type="number" formControlName="leadTimeDays" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
            </div>
            <div>
              <label class="block text-secondary font-medium mb-1 text-sm">آدرس</label>
              <input type="text" formControlName="address" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
            </div>
            <div>
              <label class="block text-secondary font-medium mb-1 text-sm">درباره شرکت</label>
              <textarea formControlName="description" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"></textarea>
            </div>

            <div *ngIf="successMessage" class="bg-green-50 text-green-600 rounded-xl px-4 py-3 text-sm">✅ {{ successMessage }}</div>

            <button type="submit" class="bg-green-600 text-white font-bold rounded-xl px-6 py-2.5 hover:bg-green-700 transition-colors">
              ذخیره تغییرات
            </button>
          </form>
        </div>
      </div>
    </section>
  `
})
export class SupplierProfileComponent implements OnInit {
  form!: FormGroup;
  successMessage = '';

  profile = {
    companyName: 'شرکت تأمین سنگ‌های قیمتی',
    city: 'یزد',
    province: 'یزد',
    rating: 4.7,
    reviewCount: 128,
    activeProducts: 38,
    completedOrders: 284,
    deliveryRate: 96.5
  };

  cities = IRAN_CITY_NAMES;
  provinces = IRAN_PROVINCE_NAMES;

  constructor(private readonly fb: FormBuilder, private readonly supplierService: SupplierService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      companyName: [this.profile.companyName, Validators.required],
      phone: ['09123456789', [Validators.required]],
      email: ['supplier@example.com', [Validators.required, Validators.email]],
      city: [this.profile.city],
      province: [this.profile.province],
      leadTimeDays: [3],
      address: ['یزد، صنعتی شماره ۵'],
      description: ['تأمین سنگ‌های قیمتی و نیمه‌قیمتی از معادن ایران']
    });
  }

  save(): void {
    this.successMessage = 'اطلاعات با موفقیت ذخیره شد.';
    setTimeout(() => this.successMessage = '', 3000);
  }
}
