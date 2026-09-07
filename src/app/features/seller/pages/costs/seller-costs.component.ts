import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { CostService, SellerMonthlyCost } from '../../../../core/services/api/cost.service';

@Component({
    selector: 'app-seller-costs',
    template: `
    <section dir="rtl" class="mx-auto max-w-6xl space-y-6"><header class="flex items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت مالی</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">سهم هزینه‌های پلتفرم</h1><p class="mt-2 text-sm text-gray-500">ریز هزینه‌های ماهانه اختصاص‌یافته به فروشگاه شما</p></div><button type="button" (click)="loadCosts()" class="rounded-xl border border-primary px-4 py-2 font-bold text-primary">بازخوانی</button></header>@if (errorMessage) {
    <p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
    }@if (loading) {
    <div class="rounded-2xl bg-white p-12 text-center text-gray-500 shadow-card">در حال بارگذاری هزینه‌ها…</div>
    }@if (!loading) {
    <div class="grid gap-4 md:grid-cols-2">@for (cost of costs; track cost) {
      <article class="rounded-2xl bg-white p-6 shadow-card"><div class="flex items-center justify-between"><h2 class="text-lg font-bold text-secondary">{{ cost.year }}/{{ cost.month }}</h2><strong class="text-primary">{{ cost.totalCost | persianNumber }} تومان</strong></div><div class="mt-5 grid grid-cols-2 gap-4 text-sm"><div class="rounded-xl bg-bg-muted p-3"><span class="text-gray-500">کمیسیون پلتفرم</span><strong class="mt-1 block">{{ cost.platformCommission | persianNumber }}</strong></div><div class="rounded-xl bg-blue-50 p-3"><span class="text-gray-500">ارسال</span><strong class="mt-1 block">{{ cost.shippingCost | persianNumber }}</strong></div><div class="rounded-xl bg-orange-50 p-3"><span class="text-gray-500">تبلیغات</span><strong class="mt-1 block">{{ cost.advertisingCost | persianNumber }}</strong></div><div class="rounded-xl bg-gray-50 p-3"><span class="text-gray-500">کارمزد تراکنش</span><strong class="mt-1 block">{{ cost.transactionFees | persianNumber }}</strong></div><div class="rounded-xl bg-purple-50 p-3"><span class="text-gray-500">سایر</span><strong class="mt-1 block">{{ cost.otherCosts | persianNumber }}</strong></div></div></article>
    }</div>
    }@if (!loading && !costs.length) {
    <p class="rounded-2xl bg-white p-10 text-center text-gray-400 shadow-card">هزینه‌ای برای نمایش وجود ندارد.</p>
    }</section>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SellerCostsComponent implements OnInit {
  costs: SellerMonthlyCost[] = [];
  loading = true;
  errorMessage = '';
  constructor(private readonly costService: CostService) {}
  ngOnInit(): void { this.loadCosts(); }
  loadCosts(): void { this.loading = true; this.costService.getSellerCosts().subscribe({ next: (result) => { this.costs = result.data ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } }); }
}
