import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

import { QnaItem } from './product-info.models';

/**
 * بخش سوالات متداول خریدار (Q&A) بر اساس داده‌های نمونه.
 *
 * TODO(task: TASK-FE-PRODUCT-DETAIL-INFO):
 * - لیست سوالات + جواب‌ها
 * - قابلیت gửi سوال جدید (در 지켜보는)
 */
@Component({
  selector: 'app-qna-section',
  templateUrl: './qna-section.component.html',
  styleUrls: ['./qna-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatListModule, MatCardModule],
})
export class QnaSectionComponent {
  @Input() qaItems?: QnaItem[] | null = null;

  get hasItems(): boolean {
    return !!(this.qaItems && this.qaItems.length > 0);
  }
}
