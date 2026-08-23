import { Component, OnInit } from '@angular/core';
import { SupplierService, SupplierDashboard, SupplierOrder } from '../../../core/services/api/supplier.service';

@Component({
  selector: 'app-supplier-dashboard',
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.scss']
})
export class SupplierDashboardComponent implements OnInit {
  dashboard: SupplierDashboard | null = null;
  recentOrders: SupplierOrder[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.supplierService.getDashboard().subscribe({
      next: (result) => {
        this.dashboard = result.data ?? null;
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
        // Use mock data for demo
        this.dashboard = {
          totalProducts: 45,
          activeProducts: 38,
          totalOrders: 284,
          pendingOrders: 12,
          totalRevenue: 45600000,
          averageRating: 4.7,
          deliverySuccessRate: 96.5,
          citiesServed: 29
        };
      }
    });

    this.supplierService.getOrders().subscribe({
      next: (result) => {
        this.recentOrders = (result.data ?? []).slice(0, 8);
      },
      error: () => {
        // Mock data
        this.recentOrders = [
          { id: '1', orderNumber: 'ORD-1001', customerName: 'فروشنده اصفهان', productName: 'انگشتر نقره', quantity: 5, totalAmount: 2500000, status: 'Processing', createdAt: new Date().toISOString(), city: 'اصفهان' },
          { id: '2', orderNumber: 'ORD-1002', customerName: 'فروشنده تهران', productName: 'دستبند طلا', quantity: 3, totalAmount: 8400000, status: 'Shipped', createdAt: new Date().toISOString(), city: 'تهران' },
          { id: '3', orderNumber: 'ORD-1003', customerName: 'فروشنده شیراز', productName: 'گردنبند زمرد', quantity: 2, totalAmount: 6200000, status: 'Pending', createdAt: new Date().toISOString(), city: 'شیراز' },
          { id: '4', orderNumber: 'ORD-1004', customerName: 'فروشنده مشهد', productName: 'سرویس نقره', quantity: 1, totalAmount: 8500000, status: 'Delivered', createdAt: new Date().toISOString(), city: 'مشهد' },
          { id: '5', orderNumber: 'ORD-1005', customerName: 'فروشنده تبریز', productName: 'سنگ فیروزه', quantity: 10, totalAmount: 3000000, status: 'Processing', createdAt: new Date().toISOString(), city: 'تبریز' },
        ];
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'Pending': 'در انتظار', 'Processing': 'در حال پردازش', 'Shipped': 'ارسال شده',
      'Delivered': 'تحویل شده', 'Cancelled': 'لغو شده', 'InTransit': 'در مسیر'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-700', 'Processing': 'bg-blue-100 text-blue-700',
      'Shipped': 'bg-purple-100 text-purple-700', 'Delivered': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700', 'InTransit': 'bg-cyan-100 text-cyan-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  }
}
