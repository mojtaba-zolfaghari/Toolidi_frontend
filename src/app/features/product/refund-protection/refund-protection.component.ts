import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';

/**
 * بخش «حفاظت بازگشت وجه» در صفحه جزئیات محصول.
 *
 * TODO(task: TASK-FE-PRODUCT-DETAIL-REFUND-DETAIL):
 * - لیست سطوح: تأمین‌کننده تاییدشده، فروشنده تاییدشده، ضمانت پلتفرم
 * - هر سطح با وضعیت Yes/No نمایش داده می‌شود
 * - اگر سطحی وجود نداشته باشد، متن مربوطه + لینک توضیحات نمایش داده می‌شود
 * - استفاده از mat-card, mat-list, mat-icon
 * - هیچ کلاس Tailwind ندارد؛ ریسپانسیو
 */
@Component({
  selector: 'app-refund-protection',
  templateUrl: './refund-protection.component.html',
  styleUrls: ['./refund-protection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RefundProtectionComponent {
  @Input() eligibility:
    | {
        supplierVerified?: boolean;
        sellerVerified?: boolean;
        platformGuarantee?: boolean;
      }
    | null = null;

  constructor(private readonly router: Router) {}

  protectedDocUrl = '/help/refund-protection';

  /** آیا حداقل یک سطح پوشش وجود دارد. */
  get hasAnyCoverage(): boolean {
    if (!this.eligibility) return false;
    return !!(
      this.eligibility.supplierVerified ||
      this.eligibility.sellerVerified ||
      this.eligibility.platformGuarantee
    );
  }

  navigateToDoc(): void {
    this.router.navigateByUrl(this.protectedDocUrl);
  }
}
