import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { PersianNumberPipe } from '../../../shared/persian-number.pipe';

import { ShippingInfo } from './product-info.models';

/**
 * اطلاعات ارسال محصول: زمان تحویل تخمینی + روش‌های حمل + هزینه تخمینی.
 *
 * TODO(task: TASK-FE-PRODUCT-DETAIL-INFO):
 * - زمان تحویل تخمینی
 * - روش‌های حمل
 * - محاسبه هزینه (در صورت وجود)
 */
@Component({
  selector: 'app-shipping-info-block',
  templateUrl: './shipping-info-block.component.html',
  styleUrls: ['./shipping-info-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PersianNumberPipe, MatIconModule, MatTooltipModule, MatListModule, MatCardModule],
})
export class ShippingInfoBlockComponent {
  @Input() shippingInfo?: ShippingInfo | null = null;

  get hasShippingInfo(): boolean {
    return !!(this.shippingInfo && this.shippingInfo.methods?.length);
  }
}
