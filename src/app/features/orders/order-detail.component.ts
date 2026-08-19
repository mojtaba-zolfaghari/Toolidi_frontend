import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Order, OrderService, OrderTracking } from '../../core/services/api/order.service';

/** صفحه جزئیات و پیگیری سفارش */
@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  tracking: OrderTracking | null = null;
  loading = true;
  errorMessage = '';
  canceling = false;
  actionMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'شناسه سفارش معتبر نیست.';
      this.loading = false;
      return;
    }

    this.orderService.getOrderById(id).subscribe({
      next: (result) => {
        this.order = result.data ?? null;
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });

    this.orderService.trackOrder(id).subscribe({
      next: (result) => (this.tracking = result.data ?? null),
      error: () => (this.tracking = null)
    });
  }

  /** آیا امکان لغو سفارش وجود دارد؟ */
  get canCancel(): boolean {
    const status = this.order?.status?.toLowerCase();
    return status === 'pending' || status === 'processing' || status === 'draft';
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

  /** لغو سفارش */
  cancelOrder(): void {
    if (!this.order) {
      return;
    }
    this.canceling = true;
    this.actionMessage = '';
    this.orderService.cancelOrder(this.order.id).subscribe({
      next: (result) => {
        this.canceling = false;
        if (result.isSuccess && this.order) {
          this.order.status = 'Cancelled';
          this.actionMessage = 'سفارش با موفقیت لغو شد.';
        } else {
          this.actionMessage = result.errorMessage ?? 'لغو سفارش انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.canceling = false;
        this.actionMessage = err.message;
      }
    });
  }
}
