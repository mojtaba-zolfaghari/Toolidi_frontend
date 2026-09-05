import { Component, OnInit } from '@angular/core';

import { BarChartDatum } from '../../../../shared/components/bar-chart/bar-chart.component';
import { AdminService, AdminSeller } from '../../../../core/services/api/admin.service';
import { ReportsService, SalesReport, SellerPerformanceReport, TopProductReport } from '../../../../core/services/api/reports.service';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.component.html'
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
  sellerSearch = '';
  selectedSellerIds: string[] = [];
  topProductsLoading = true;
  dailyLoading = true;
  monthlyLoading = true;
  performanceLoading = true;
  errorMessage = '';

  sellerFilterOptions = [{ value: '', label: 'همه فروشندگان' }];

  constructor(private readonly adminService: AdminService, private readonly reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadDaily();
    this.loadMonthly();
    this.loadSellerPerformance();
    this.loadTopProducts();
    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.sellers = result.data?.items ?? [];
        this.sellerFilterOptions = [
          { value: '', label: 'همه فروشندگان' },
          ...this.sellers.map(s => ({ value: s.id, label: s.companyName }))
        ];
      },
      error: () => this.sellers = []
    });
  }

  loadDaily(): void {
    this.dailyLoading = true;
    this.adminService.getDailyReport(this.dailyDate).subscribe({
      next: (result) => { this.dailyReport = result.data ?? null; this.dailyLoading = false; },
      error: (error: Error) => { this.errorMessage = error.message; this.dailyLoading = false; }
    });
  }

  /** Called by the Jalali date picker with the Gregorian equivalent (YYYY-MM-DD). */
  onDailyDateChange(iso: string): void {
    this.dailyDate = iso;
    this.loadDaily();
  }

  /** Called by the Jalali month picker with the Gregorian equivalent (YYYY-MM). */
  onMonthlyDateChange(iso: string): void {
    this.monthlyMonth = iso;
    this.loadMonthly();
  }

  loadMonthly(): void {
    this.monthlyLoading = true;
    // monthlyMonth is 'YYYY-MM' format, extract year and month for the API
    const [yearStr, monthStr] = this.monthlyMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    this.reportsService.getMonthlyReport(month + '', year).subscribe({
      next: (result) => { this.monthlyReport = result.data ?? null; this.monthlyLoading = false; },
      error: () => { this.monthlyReport = null; this.monthlyLoading = false; }
    });
  }

  get filteredSellers(): AdminSeller[] {
    const query = this.sellerSearch.trim().toLowerCase();
    return this.sellers.filter(seller => !query || seller.companyName.toLowerCase().includes(query));
  }

  toggleSeller(sellerId: string): void {
    this.selectedSellerIds = this.selectedSellerIds.includes(sellerId)
      ? this.selectedSellerIds.filter(id => id !== sellerId)
      : [...this.selectedSellerIds, sellerId];
    this.selectedSellerId = this.selectedSellerIds.length === 1 ? this.selectedSellerIds[0] : '';
    this.loadSellerPerformance();
  }

  clearSellerSelection(): void {
    this.selectedSellerIds = [];
    this.selectedSellerId = '';
    this.loadSellerPerformance();
  }

  loadSellerPerformance(): void {
    this.performanceLoading = true;
    this.reportsService.getSellerPerformance(this.selectedSellerIds.length === 1 ? this.selectedSellerIds[0] : undefined).subscribe({
      next: (result) => { this.performance = result.data ?? []; this.performanceLoading = false; },
      error: () => { this.performance = []; this.performanceLoading = false; }
    });
  }

  loadTopProducts(): void {
    this.topProductsLoading = true;
    // top-products endpoint may not exist yet, gracefully handle
    this.topProducts = [];
    this.topProductsLoading = false;
  }

  refreshAll(): void {
    this.loadDaily();
    this.loadMonthly();
    this.loadSellerPerformance();
    this.loadTopProducts();
  }

  exportCSV(): void {
    // Placeholder for CSV export
    alert('خروجی CSV به زودی اضافه خواهد شد.');
  }

  get topProductsChart(): BarChartDatum[] { return this.topProducts.map((product) => ({ label: product.productName, value: product.salesAmount })); }
  get salesTrendChart(): BarChartDatum[] { return (this.monthlyReport?.trend ?? this.dailyReport?.trend ?? []).map((point) => ({ label: point.label, value: point.sales })); }

  private toDateInput(date: Date): string { return date.toISOString().slice(0, 10); }
  private toMonthInput(date: Date): string { return date.toISOString().slice(0, 7); }
}
