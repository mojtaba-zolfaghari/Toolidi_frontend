import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RefundPolicySummary } from './product-info.models';

/**
 * خلاصه سیاست بازگشت وجه — نمایش کوتاه + لینک به صفحه سیاست کامل.
 *
 * TODO(task: TASK-FE-PRODUCT-DETAIL-INFO):
 * - نمایش خلاصه کوتاه با لینک به صفحه سیاست کامل
 */
@Component({
  selector: 'app-refund-policy-summary',
  templateUrl: './refund-policy-summary.component.html',
  styleUrls: ['./refund-policy-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
})
export class RefundPolicySummaryComponent {
  @Input() policySummary?: RefundPolicySummary | null = null;

  protected docUrl = '/help/refund-policy';
  readonly defaultDetailUrl = '/help/refund-policy';
}
