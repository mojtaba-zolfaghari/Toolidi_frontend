import { Component, OnInit } from '@angular/core';
import { AdminService, AdminUser, AdminProduct, AdminSeller } from '../core/services/api/admin.service';
import { PublicService } from '../core/services/api/public.service';
import { ApiService } from '../core/services/api.service';
import { BarChartDatum } from '../shared/components/bar-chart/bar-chart.component';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  // Stats
  totalUsers = 0;
  totalProducts = 0;
  totalSellers = 0;
  totalOrders = 0;
  totalRevenue = 0;
  activeSellers = 0;
  publishedProducts = 0;
  pendingProducts = 0;

  // Lists for charts
  users: AdminUser[] = [];
  products: AdminProduct[] = [];
  sellers: AdminSeller[] = [];
  recentOrders: any[] = [];

  // Loading
  loading = true;

  // Chart data
  productStatusChart: BarChartDatum[] = [];
  orderStatusChart: BarChartDatum[] = [];

  constructor(
    private readonly adminService: AdminService,
    private readonly publicService: PublicService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    // Load all data in parallel
    this.adminService.getUsers({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.users = result.data?.items ?? [];
        this.totalUsers = result.data?.totalCount ?? 0;
      }
    });

    this.adminService.getAdminProducts({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.products = result.data?.items ?? [];
        this.totalProducts = result.data?.totalCount ?? 0;
        this.publishedProducts = this.products.filter(p => p.publishStatus === 'Published').length;
        this.pendingProducts = this.products.filter(p => p.publishStatus === 'PendingApproval').length;
        this.buildProductChart();
      }
    });

    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.sellers = result.data?.items ?? [];
        this.totalSellers = result.data?.totalCount ?? 0;
        this.activeSellers = this.sellers.filter(s => s.isVerified).length;
      }
    });

    // Load top performers stats
    this.api.get<any>('/v1/top-performers/stats').subscribe({
      next: (result: any) => {
        if (result?.data) {
          this.totalOrders = result.data.orders || 0;
          this.loading = false;
        }
      },
      error: () => { this.loading = false; }
    });

    // Load recent orders
    this.api.get<any>('/v1/public/globe-orders').subscribe({
      next: (result: any) => {
        if (result?.data?.orders) {
          this.recentOrders = result.data.orders.slice(0, 10);
          this.buildOrderChart();
        }
      }
    });
  }

  private buildProductChart(): void {
    const counts = new Map<string, number>();
    for (const product of this.products) {
      const key = product.publishStatus || 'نامشخص';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const colorMap: { [key: string]: string } = {
      'Published': '#22c55e',
      'Approved': '#3b82f6',
      'PendingApproval': '#f59e0b',
      'Draft': '#94a3b8'
    };
    this.productStatusChart = Array.from(counts.entries()).map(([label, value]) => ({
      label, value
    }));
  }

  private buildOrderChart(): void {
    const counts = new Map<string, number>();
    for (const order of this.recentOrders) {
      const key = order.status || 'نامشخص';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    this.orderStatusChart = Array.from(counts.entries()).map(([label, value]) => ({
      label, value
    }));
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'Pending': 'در انتظار',
      'Processing': 'در حال پردازش',
      'Shipped': 'ارسال شده',
      'InTransit': 'در مسیر',
      'Delivered': 'تحویل شده',
      'Cancelled': 'لغو شده',
      'Draft': 'پیش‌نویس',
      'PendingApproval': 'در انتظار تأیید',
      'Approved': 'تأیید شده',
      'Published': 'منتشر شده'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Processing': 'bg-blue-100 text-blue-700',
      'Shipped': 'bg-purple-100 text-purple-700',
      'InTransit': 'bg-green-100 text-green-700',
      'Delivered': 'bg-green-500 text-white',
      'Cancelled': 'bg-red-100 text-red-700',
      'Draft': 'bg-gray-100 text-gray-600',
      'PendingApproval': 'bg-orange-100 text-orange-700',
      'Approved': 'bg-blue-100 text-blue-700',
      'Published': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }
}
