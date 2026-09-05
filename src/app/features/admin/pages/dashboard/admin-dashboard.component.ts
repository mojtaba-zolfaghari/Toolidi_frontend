import { Component, OnInit } from '@angular/core';
import { AdminService, AdminDashboardData } from '../../../../core/services/api/admin.service';
import { BarChartDatum } from '../../../../shared/components/bar-chart/bar-chart.component';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  error: string | null = null;
  dashboardData: AdminDashboardData = {} as AdminDashboardData;
  statCards: StatCard[] = [];

  headerActions = [
    { label: 'بازخوانی', icon: '🔄', click: () => this.loadDashboardData() }
  ];

  quickActions = [
    { matIcon: 'inventory_2', label: 'محصولات', link: '/admin/products' },
    { matIcon: 'shopping_cart', label: 'سفارشات', link: '/admin/products' },
    { matIcon: 'group', label: 'کاربران', link: '/admin/users' },
    { matIcon: 'storefront', label: 'فروشندگان', link: '/admin/sellers' },
    { matIcon: 'download', label: 'استودیو ایمپورت', link: '/admin/import-studio' },
    { matIcon: 'bar_chart', label: 'گزارش‌ها', link: '/admin/reports' }
  ];

  constructor(
    private readonly adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getDashboard().subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          const data = result.data;
          
          this.dashboardData = {
            totalUsers: data.totalUsers,
            totalSellers: data.totalSellers,
            totalOrders: data.totalOrders,
            totalRevenue: data.totalRevenue,
            conversionRate: data.conversionRate,
            dailySales: data.dailySales || [],
            weeklySales: data.weeklySales || [],
            monthlySales: data.monthlySales || [],
            recentOrders: data.recentOrders || [],
            lowStockAlerts: data.lowStockAlerts || []
          };

          this.statCards = [
            {
              label: 'کل سفارشات',
              value: data.totalOrders.toLocaleString('fa-IR'),
              icon: '📦',
              trend: 'up'
            },
            {
              label: 'درآمد کل',
              value: ((data.totalRevenue || 0) / 1000000).toFixed(1) + ' م ت',
              icon: '💰',
              trend: 'up'
            },
            {
              label: 'کاربران',
              value: data.totalUsers.toLocaleString('fa-IR'),
              icon: '👥',
              trend: 'neutral'
            },
            {
              label: 'فروشندگان',
              value: data.totalSellers.toLocaleString('fa-IR'),
              icon: '🏪',
              trend: 'neutral'
            },
            {
              label: 'نرخ تبدیل',
              value: ((data.conversionRate || 0)).toFixed(1) + '%',
              icon: '📊',
              trend: 'neutral'
            }
          ];
        } else {
          this.error = result.errorMessage || 'خطا در بارگذاری داشبورد';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'خطا در ارتباط با سرور';
        this.loading = false;
        console.error('Dashboard load error:', err);
      }
    });
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

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'Pending': '⏳',
      'Processing': '🔄',
      'Shipped': '📦',
      'InTransit': '🚚',
      'Delivered': '✅',
      'Cancelled': '❌',
      'Draft': '📝',
      'PendingApproval': '⏳',
      'Approved': '✅',
      'Published': '✅'
    };
    return icons[status] || '📦';
  }

  maxValue(arr: { value: number }[]): number {
    return Math.max(...arr.map(p => p.value || 0), 1);
  }
}