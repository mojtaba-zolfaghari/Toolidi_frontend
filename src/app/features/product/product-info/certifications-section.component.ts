import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

import { CertificationEntry } from './product-info.models';

/**
 * بخش گواهی‌نامه‌ها محصول: لیست گواهی‌ها با آیکون و توoltip توضیحی.
 *
 * TODO(task: TASK-FE-PRODUCT-DETAIL-INFO):
 * - لیست گواهی‌ها {ISO, CE, RoHS, Halal, ...}
 * - tooltip توضیح هر گواهی
 */
@Component({
  selector: 'app-certifications-section',
  templateUrl: './certifications-section.component.html',
  styleUrls: ['./certifications-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, MatListModule, MatCardModule],
})
export class CertificationsSectionComponent {
  /** لیست گواهی‌های محصول */
  @Input() certifications?: CertificationEntry[] | null = null;

  /** آیا حداقل یک گواهی وجود دارد. */
  get hasCertifications(): boolean {
    return !!(this.certifications && this.certifications.length > 0);
  }

  /** آیکون پیش‌فرض وقتی گواهی آیکون خاصی ندارد. */
  readonly fallbackIcon = 'verified_user';
}
