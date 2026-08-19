import { Component, OnInit } from '@angular/core';

import {
  CommissionBreakdown,
  DashboardSummary,
  OrderStats,
  ProductStats,
  SellerService,
  SellerStatistics
} from '../../../core/services/api/seller.service';

/** داشبورد آماری فروشنده */
@Component({
  selector: 'app-seller-dashboard',
  templateUrl: './seller-dashboard.component.html'
})
export class SellerDashboardComponent implements OnInit {
  dashboard: DashboardSummary | null = null;
  statistics: SellerStatistics | null = null;
  productStats: ProductStats[] = [];
  orderStats: OrderStats | null = null;
  commissions: CommissionBreakdown[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly sellerService: SellerService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  /** دریافت همه داده‌های داشبورد فروشنده */
  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.sellerService.getDashboard().subscribe({
      next: (result) => (this.dashboard = result.data ?? null),
      error: (err: Error) => (this.errorMessage = err.message)
    });
    this.sellerService.getStatistics().subscribe({
      next: (result) => (this.statistics = result.data ?? null),
      error: () => (this.statistics = null)
    });
    this.sellerService.getProductStats().subscribe({
      next: (result) => (this.productStats = result.data ?? []),
      error: () => (this.productStats = [])
    });
    this.sellerService.getOrderStats().subscribe({
      next: (result) => (this.orderStats = result.data ?? null),
      error: () => (this.orderStats = null)
    });
    this.sellerService.getCommissionBreakdown().subscribe({
      next: (result) => {
        this.commissions = result.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.commissions = [];
        this.loading = false;
      }
    });
  }
}
