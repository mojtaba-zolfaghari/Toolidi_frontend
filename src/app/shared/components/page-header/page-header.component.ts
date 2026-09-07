import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Page header with title, subtitle, and action buttons.
 * Angular Material buttons (TASK-FE-ADMIN-REDESIGN-001-MAT), RTL support.
 */
@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actions: Array<{ label: string; icon?: string; color?: string; click: () => void }> = [];
  @Input() breadcrumbs: Array<{ label: string; link?: string }> = [];
}
