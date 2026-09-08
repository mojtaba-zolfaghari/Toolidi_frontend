import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

/**
 * نشانگر حفاظت بازگشت وجه روی کارت محصول.
 *
 * TODO(task: TASK-FE-PRODUCT-CARD-REFUND-DISPLAY):
 * - رنگ سبز وقتی پوشش فعال است، خاکستری وقتی غیرفعال
 * - tooltip: «بازگشت وجه محافظت‌شده: تولیدکننده → فروشنده → خریدار»
 * - از mat-badge / mat-icon + tooltip استفاده می‌کند
 * - هیچ کلاس Tailwind ندارد؛ کامپوننت فلگ از داده محصول دریافت می‌کند
 */
@Component({
  selector: 'app-refund-badge',
  templateUrl: './refund-badge.component.html',
  styleUrls: ['./refund-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefundBadgeComponent {
  /** آیا دو طرف (تأمین‌کننده و فروشنده) تایید شده‌اند یا ضمانت پلتفرم شامل می‌شود. */
  @Input() covered = false;
}
