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
}
