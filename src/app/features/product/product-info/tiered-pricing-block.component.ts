import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { PersianNumberPipe } from '../../../shared/persian-number.pipe';

import { PriceTier } from './product-info.models';

/**
 * блок цен по количеству (MOQ-based tier pricing).
 *
 * TODO(task: TASK-FE-PRODUCT-DETAIL-INFO):
 * - لیست سطوح قیمت با MOQ
 * - tooltip برای هر سطح توضیح discount
 */
@Component({
  selector: 'app-tiered-pricing-block',
  templateUrl: './tiered-pricing-block.component.html',
  styleUrls: ['./tiered-pricing-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PersianNumberPipe, MatIconModule, MatTooltipModule, MatListModule, MatCardModule],
})
export class TieredPricingBlockComponent {
  @Input() tiers?: PriceTier[] | null = null;

  get hasTiers(): boolean {
    return !!(this.tiers && this.tiers.length > 0);
  }

  tierLabel(tier: PriceTier): string {
    if (tier.minQty <= 1) return 'یک‌شناسه';
    if (tier.minQty < 10) return `${tier.minQty} عدد و بیشتر`;
    return `${tier.minQty}+ عدد`;
  }
}
