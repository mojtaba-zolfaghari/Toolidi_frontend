import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Order, OrderService } from '../../core/services/api/order.service';

/** صفحه فهرست سفارش‌های کاربر */
@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly orderService: OrderService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  /** بارگذاری سفارش‌های کاربر جاری */
  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: (result) => {
        this.orders = result.data?.items ?? [];
        this.totalCount = result.data?.totalCount ?? 0;
        this.loading = false;
      },
      error: (err: Error) => {
        this.orders = [];
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  /** رفتن به جزئیات سفارش */
  openOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  /** تغییر صفحه */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this.loadOrders();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  /** تعداد اقلام سفارش */
  itemCount(order: Order): number {
    return order.items?.reduce((count, item) => count + item.quantity, 0) ?? 0;
  }

  /** کلاس رنگ وضعیت سفارش */
  statusClass(status: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':
        return 'bg-orange-50 text-orange-600';
      case 'processing':
        return 'bg-blue-50 text-blue-600';
      case 'shipped':
        return 'bg-indigo-50 text-indigo-600';
      case 'delivered':
        return 'bg-green-50 text-green-600';
      case 'cancelled':
        return 'bg-red-50 text-red-600';
      case 'returned':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  /** عنوان فارسی وضعیت */
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'در انتظار بررسی',
      processing: 'در حال پردازش',
      shipped: 'ارسال‌شده',
      delivered: 'تحویل‌شده',
      cancelled: 'لغوشده',
      returned: 'مرجوعی'
    };
    return map[(status ?? '').toLowerCase()] ?? (status || 'در انتظار بررسی');
  }
}
