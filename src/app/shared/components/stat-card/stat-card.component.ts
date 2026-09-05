import { Component, Input } from '@angular/core';

/**
 * Stat card for admin dashboard showing a metric with title, value, icon, and trend.
 * Angular Material card (TASK-FE-ADMIN-REDESIGN-001-MAT), RTL support.
 */
@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() icon = '';
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() trendValue = '';
  /** Color token: primary | success | warning | danger | info */
  @Input() color = 'primary';
  @Input() subtitle = '';

  get trendIcon(): string {
    switch (this.trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  }
}
