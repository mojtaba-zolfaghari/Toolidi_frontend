import { Component, Input } from '@angular/core';

/** Estimated delivery for a single cart item */
export interface EstimatedDelivery {
  productName: string;
  quantity: number;
  supplierName: string;
  estimatedReadyDate?: string;
  estimatedDeliveryDate?: string;
  capacitySet: boolean;
}

@Component({
  selector: 'app-estimated-delivery',
  template: `
    <div class="space-y-3" *ngIf="deliveries.length">
      <h3 class="text-sm font-bold text-secondary">زمان تقریبی تحویل</h3>

      <div *ngFor="let item of deliveries" class="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-secondary">{{ item.productName }}</p>
            <p class="text-xs text-gray-400">فروشنده: {{ item.supplierName }} · تعداد: {{ item.quantity }}</p>
          </div>
          <div class="text-left">
            <p *ngIf="item.capacitySet && item.estimatedDeliveryDate" class="text-sm font-bold text-primary">
              {{ item.estimatedDeliveryDate | persianDate:'yyyy/MM/dd' }}
            </p>
            <p *ngIf="!item.capacitySet" class="text-xs text-orange-500 font-medium">
              در انتظار تأیید
            </p>
            <p *ngIf="item.capacitySet && !item.estimatedDeliveryDate && item.estimatedReadyDate"
               class="text-xs text-gray-500">
              آماده: {{ item.estimatedReadyDate | persianDate:'yyyy/MM/dd' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Max delivery date (bottleneck) -->
      <div *ngIf="maxDeliveryDate" class="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-secondary">حداکثر زمان تحویل</span>
          <span class="text-lg font-extrabold text-primary">{{ maxDeliveryDate | persianDate:'yyyy/MM/dd' }}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">تاریخ تحویل نهایی بر اساس آخرین آماده‌سازی در بین تمام اقلام</p>
      </div>
    </div>
  `
})
export class EstimatedDeliveryComponent {
  @Input() deliveries: EstimatedDelivery[] = [];

  get maxDeliveryDate(): string | null {
    const dates = this.deliveries
      .filter(d => d.capacitySet && d.estimatedDeliveryDate)
      .map(d => d.estimatedDeliveryDate!);
    if (!dates.length) return null;
    return dates.sort().reverse()[0];
  }
}
