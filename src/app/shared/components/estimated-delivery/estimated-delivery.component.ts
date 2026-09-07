import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

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
    @if (deliveries.length) {
      <div class="est-delivery">
        <h3 class="est-delivery__title">زمان تقریبی تحویل</h3>
        @for (item of deliveries; track item) {
          <div class="est-delivery__item">
            <div class="est-delivery__row">
              <div class="est-delivery__info">
                <p class="est-delivery__product">{{ item.productName }}</p>
                <p class="est-delivery__meta">فروشنده: {{ item.supplierName }} · تعداد: {{ item.quantity }}</p>
              </div>
              <div class="est-delivery__date">
                @if (item.capacitySet && item.estimatedDeliveryDate) {
                  <p class="est-delivery__date-value">
                    {{ item.estimatedDeliveryDate | persianDate:'yyyy/MM/dd' }}
                  </p>
                }
                @if (!item.capacitySet) {
                  <p class="est-delivery__pending">
                    در انتظار تأیید
                  </p>
                }
                @if (item.capacitySet && !item.estimatedDeliveryDate && item.estimatedReadyDate) {
                  <p
                    class="est-delivery__ready">
                    آماده: {{ item.estimatedReadyDate | persianDate:'yyyy/MM/dd' }}
                  </p>
                }
              </div>
            </div>
          </div>
        }
        <!-- Max delivery date (bottleneck) -->
        @if (maxDeliveryDate) {
          <div class="est-delivery__max">
            <div class="est-delivery__row">
              <span class="est-delivery__max-label">حداکثر زمان تحویل</span>
              <span class="est-delivery__max-value">{{ maxDeliveryDate | persianDate:'yyyy/MM/dd' }}</span>
            </div>
            <p class="est-delivery__max-hint">تاریخ تحویل نهایی بر اساس آخرین آماده‌سازی در بین تمام اقلام</p>
          </div>
        }
      </div>
    }
    `,
    styles: [`
    :host { display: block; }

    .est-delivery {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .est-delivery__title {
      margin: 0;
      color: #1B2A4A;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .est-delivery__item {
      border: 1px solid #f3f4f6;
      border-radius: 0.75rem;
      background: #f9fafb;
      padding: 0.75rem;
    }

    .est-delivery__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .est-delivery__info {
      flex: 1;
      min-width: 0;
    }

    .est-delivery__product {
      margin: 0;
      color: #1B2A4A;
      font-size: 0.875rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .est-delivery__meta {
      margin: 0;
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .est-delivery__date {
      flex-shrink: 0;
      text-align: left;
    }

    .est-delivery__date-value {
      margin: 0;
      color: var(--mat-sys-primary, #6C3FC5);
      font-size: 0.875rem;
      font-weight: 700;
    }

    .est-delivery__pending {
      margin: 0;
      color: #f97316;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .est-delivery__ready {
      margin: 0;
      color: #6b7280;
      font-size: 0.75rem;
    }

    .est-delivery__max {
      border: 1px solid rgba(108, 63, 197, 0.2);
      border-radius: 0.75rem;
      background: rgba(108, 63, 197, 0.05);
      padding: 0.75rem;
    }

    .est-delivery__max-label {
      color: #1B2A4A;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .est-delivery__max-value {
      color: var(--mat-sys-primary, #6C3FC5);
      font-size: 1.125rem;
      font-weight: 800;
    }

    .est-delivery__max-hint {
      margin: 0.25rem 0 0;
      color: #6b7280;
      font-size: 0.75rem;
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
