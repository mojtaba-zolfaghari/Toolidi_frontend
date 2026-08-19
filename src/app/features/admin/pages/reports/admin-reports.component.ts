import { Component, OnInit } from '@angular/core';

import { BarChartDatum } from '../../../../shared/components/bar-chart/bar-chart.component';
import { AdminService, AdminSeller } from '../../../../core/services/api/admin.service';
import { ReportsService, SalesReport, SellerPerformanceReport, TopProductReport } from '../../../../core/services/api/reports.service';

@Component({
  selector: 'app-admin-reports',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <header><p class="text-sm font-medium text-primary">مدیریت سامانه</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">گزارش‌ها</h1><p class="mt-2 text-sm text-gray-500">بررسی فروش روزانه، ماهانه و عملکرد فروشندگان</p></header>
      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2"><article class="rounded-2xl bg-white p-6 shadow-card"><div class="flex flex-wrap items-end justify-between gap-4"><div><h2 class="text-xl font-bold text-secondary">گزارش روزانه</h2><p class="mt-1 text-sm text-gray-500">آمار فروش برای تاریخ انتخاب‌شده</p></div><label class="text-sm text-secondary">تاریخ<input [(ngModel)]="dailyDate" (change)="loadDaily()" type="date" class="mt-1 block rounded-xl border border-gray-300 px-3 py-2" /></label></div><div *ngIf="dailyLoading" class="py-10 text-center text-gray-500">در حال دریافت گزارش…</div><div *ngIf="!dailyLoading" class="mt-6 grid grid-cols-2 gap-3"><div class="rounded-xl bg-bg-muted p-4"><span class="text-xs text-gray-500">کل سفارش‌ها</span><strong class="mt-2 block text-2xl text-secondary">{{ dailyReport?.totalOrders ?? 0 | number }}</strong></div><div class="rounded-xl bg-purple-50 p-4"><span class="text-xs text-gray-500">کل فروش</span><strong class="mt-2 block text-lg text-primary">{{ dailyReport?.totalSales ?? 0 | number }} تومان</strong></div><div class="rounded-xl bg-orange-50 p-4"><span class="text-xs text-gray-500">کل تخفیف</span><strong class="mt-2 block text-lg text-orange-700">{{ dailyReport?.totalDiscount ?? 0 | number }} تومان</strong></div><div class="rounded-xl bg-green-50 p-4"><span class="text-xs text-gray-500">فروش خالص</span><strong class="mt-2 block text-lg text-green-700">{{ dailyReport?.netSales ?? 0 | number }} تومان</strong></div></div></article><article class="rounded-2xl bg-white p-6 shadow-card"><div class="flex flex-wrap items-end justify-between gap-4"><div><h2 class="text-xl font-bold text-secondary">گزارش ماهانه</h2><p class="mt-1 text-sm text-gray-500">آمار فروش برای ماه انتخاب‌شده</p></div><label class="text-sm text-secondary">ماه<input [(ngModel)]="monthlyMonth" (change)="loadMonthly()" type="month" class="mt-1 block rounded-xl border border-gray-300 px-3 py-2" /></label></div><div *ngIf="monthlyLoading" class="py-10 text-center text-gray-500">در حال دریافت گزارش…</div><div *ngIf="!monthlyLoading" class="mt-6 grid grid-cols-2 gap-3"><div class="rounded-xl bg-bg-muted p-4"><span class="text-xs text-gray-500">کل سفارش‌ها</span><strong class="mt-2 block text-2xl text-secondary">{{ monthlyReport?.totalOrders ?? 0 | number }}</strong></div><div class="rounded-xl bg-purple-50 p-4"><span class="text-xs text-gray-500">کل فروش</span><strong class="mt-2 block text-lg text-primary">{{ monthlyReport?.totalSales ?? 0 | number }} تومان</strong></div><div class="rounded-xl bg-orange-50 p-4"><span class="text-xs text-gray-500">کل تخفیف</span><strong class="mt-2 block text-lg text-orange-700">{{ monthlyReport?.totalDiscount ?? 0 | number }} تومان</strong></div><div class="rounded-xl bg-green-50 p-4"><span class="text-xs text-gray-500">فروش خالص</span><strong class="mt-2 block text-lg text-green-700">{{ monthlyReport?.netSales ?? 0 | number }} تومان</strong></div></div></article></div><article class="rounded-2xl bg-white p-6 shadow-card"><h2 class="text-xl font-bold text-secondary">روند فروش</h2><app-bar-chart *ngIf="salesTrendChart.length" [data]="salesTrendChart"></app-bar-chart><p *ngIf="!salesTrendChart.length" class="py-6 text-center text-gray-400">روندی برای نمایش وجود ندارد.</p></article>
      <article class="rounded-2xl bg-white p-6 shadow-card"><div class="flex items-center justify-between"><div><h2 class="text-xl font-bold text-secondary">عملکرد فروشندگان</h2><p class="mt-1 text-sm text-gray-500">مقایسه فروش و تعداد سفارش‌ها</p></div><div class="flex gap-2"><select [(ngModel)]="selectedSellerId" (change)="loadSellerPerformance()" class="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">همه فروشندگان</option><option *ngFor="let seller of sellers" [value]="seller.id">{{ seller.companyName }}</option></select><button type="button" (click)="loadSellerPerformance()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary">بازخوانی</button></div></div><div *ngIf="performanceLoading" class="py-10 text-center text-gray-500">در حال دریافت گزارش…</div><div *ngIf="!performanceLoading" class="mt-5 overflow-x-auto"><table class="w-full min-w-[650px] text-right text-sm"><thead><tr class="border-b text-gray-500"><th class="p-3">فروشنده</th><th class="p-3">تعداد سفارش</th><th class="p-3">فروش</th><th class="p-3">کمیسیون</th><th class="p-3">میانگین سفارش</th><th class="p-3">فروش خالص</th></tr></thead><tbody><tr *ngFor="let seller of performance" class="border-b last:border-0"><td class="p-3 font-bold text-secondary">{{ seller.companyName }}</td><td class="p-3">{{ seller.totalOrders | number }}</td><td class="p-3">{{ seller.totalSales | number }} تومان</td><td class="p-3">{{ seller.totalCommission ?? 0 | number }} تومان</td><td class="p-3">{{ seller.averageOrderValue ?? 0 | number }} تومان</td><td class="p-3 text-green-700">{{ seller.netSales | number }} تومان</td></tr></tbody></table><p *ngIf="!performance.length" class="py-8 text-center text-gray-400">داده‌ای برای نمایش وجود ندارد.</p></div></article><article class="rounded-2xl bg-white p-6 shadow-card"><div class="flex items-center justify-between"><div><h2 class="text-xl font-bold text-secondary">پرفروش‌ترین محصولات</h2><p class="mt-1 text-sm text-gray-500">۱۰ محصول برتر بر اساس مبلغ فروش</p></div><button type="button" (click)="loadTopProducts()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary">بازخوانی</button></div><div *ngIf="topProductsLoading" class="py-8 text-center text-gray-500">در حال دریافت گزارش…</div><div *ngIf="!topProductsLoading" class="mt-5"><app-bar-chart *ngIf="topProductsChart.length" [data]="topProductsChart"></app-bar-chart><div class="mt-5 overflow-x-auto"><table class="w-full min-w-[700px] text-right text-sm"><thead><tr class="border-b text-gray-500"><th class="p-3">ردیف</th><th class="p-3">محصول</th><th class="p-3">فروشنده</th><th class="p-3">تعداد فروش</th><th class="p-3">مبلغ فروش</th></tr></thead><tbody><tr *ngFor="let product of topProducts; let i = index" class="border-b last:border-0"><td class="p-3">{{ i + 1 }}</td><td class="p-3 font-bold text-secondary">{{ product.productName }}</td><td class="p-3">{{ product.sellerName || '—' }}</td><td class="p-3">{{ product.quantitySold ?? 0 | number }}</td><td class="p-3 text-primary">{{ product.salesAmount | number }} تومان</td></tr></tbody></table><p *ngIf="!topProducts.length" class="py-8 text-center text-gray-400">داده‌ای برای نمایش وجود ندارد.</p></div></div></article>
    </section>
  `
})
export class AdminReportsComponent implements OnInit {
  dailyDate = this.toDateInput(new Date());
  monthlyMonth = this.toMonthInput(new Date());
  dailyReport: SalesReport | null = null;
  monthlyReport: SalesReport | null = null;
  performance: SellerPerformanceReport[] = [];
  topProducts: TopProductReport[] = [];
  sellers: AdminSeller[] = [];
  selectedSellerId = '';
  topProductsLoading = true;
  dailyLoading = true;
  monthlyLoading = true;
  performanceLoading = true;
  errorMessage = '';

  constructor(private readonly adminService: AdminService, private readonly reportsService: ReportsService) {}

  ngOnInit(): void { this.loadDaily(); this.loadMonthly(); this.loadSellerPerformance(); this.loadTopProducts(); this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.sellers = result.data?.items ?? [], error: () => this.sellers = [] }); }

  loadDaily(): void {
    this.dailyLoading = true;
    this.adminService.getDailyReport(this.dailyDate).subscribe({
      next: (result) => { this.dailyReport = result.data ?? null; this.dailyLoading = false; },
      error: (error: Error) => { this.errorMessage = error.message; this.dailyLoading = false; }
    });
  }

  loadMonthly(): void {
    this.monthlyLoading = true;
    this.adminService.getMonthlyReport(this.monthlyMonth).subscribe({
      next: (result) => { this.monthlyReport = result.data ?? null; this.monthlyLoading = false; },
      error: (error: Error) => { this.errorMessage = error.message; this.monthlyLoading = false; }
    });
  }

  loadSellerPerformance(): void {
    this.performanceLoading = true;
    this.reportsService.getSellerPerformance(this.selectedSellerId || undefined).subscribe({
      next: (result) => { this.performance = result.data ?? []; this.performanceLoading = false; },
      error: () => { this.performance = []; this.performanceLoading = false; }
    });
  }

  get topProductsChart(): BarChartDatum[] { return this.topProducts.map((product) => ({ label: product.productName, value: product.salesAmount })); }

  get salesTrendChart(): BarChartDatum[] { return (this.monthlyReport?.trend ?? this.dailyReport?.trend ?? []).map((point) => ({ label: point.label, value: point.sales })); }

  loadTopProducts(): void {
    this.topProductsLoading = true;
    this.reportsService.getTopProducts().subscribe({ next: (result) => { this.topProducts = (result.data ?? []).slice(0, 10); this.topProductsLoading = false; }, error: () => { this.topProducts = []; this.topProductsLoading = false; } });
  }

  private toDateInput(date: Date): string { return date.toISOString().slice(0, 10); }
  private toMonthInput(date: Date): string { return date.toISOString().slice(0, 7); }
}
