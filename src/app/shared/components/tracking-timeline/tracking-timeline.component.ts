import { Component, Input } from '@angular/core';

/** Timeline step definition */
export interface TimelineStep {
  key: string;
  label: string;
  icon: string;
  date?: string;
  completed: boolean;
  current: boolean;
}

@Component({
  selector: 'app-tracking-timeline',
  template: `
    <div class="timeline">
      <!-- Vertical line -->
      <div class="timeline__line" aria-hidden="true"></div>

      <div class="timeline__steps">
        <div *ngFor="let step of steps; let last = last" class="timeline__row">
          <!-- Circle indicator -->
          <div class="timeline__dot"
               [class.timeline__dot--completed]="step.completed"
               [class.timeline__dot--current]="step.current && !step.completed"
               [class.timeline__dot--pending]="!step.completed && !step.current">
            <span *ngIf="step.completed">✓</span>
            <span *ngIf="step.current && !step.completed">{{ step.icon }}</span>
            <span *ngIf="!step.completed && !step.current">{{ step.icon }}</span>
          </div>

          <!-- Content -->
          <div class="timeline__content" [class.is-muted]="!step.completed && !step.current">
            <p class="timeline__label"
               [class.timeline__label--completed]="step.completed"
               [class.timeline__label--current]="step.current && !step.completed">
              {{ step.label }}
            </p>
            <p *ngIf="step.date" class="timeline__date">{{ step.date }}</p>
            <p *ngIf="step.current && !step.completed" class="timeline__current-hint">وضعیت فعلی</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .timeline {
      position: relative;
    }

    .timeline__line {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 1.25rem;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline__steps {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .timeline__row {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .timeline__dot {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 700;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .timeline__dot--completed {
      background: #22c55e;
      color: #fff;
    }

    .timeline__dot--current {
      background: var(--mat-sys-primary, #6C3FC5);
      color: #fff;
    }

    .timeline__dot--pending {
      background: #e5e7eb;
      color: #6b7280;
    }

    .timeline__content {
      flex: 1;
      padding-bottom: 0.5rem;
    }

    .timeline__content.is-muted {
      opacity: 0.5;
    }

    .timeline__label {
      margin: 0;
      color: #1B2A4A;
      font-weight: 700;
    }

    .timeline__label--completed {
      color: #15803d;
    }

    .timeline__label--current {
      color: var(--mat-sys-primary, #6C3FC5);
    }

    .timeline__date {
      margin: 0.125rem 0 0;
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .timeline__current-hint {
      margin: 0.125rem 0 0;
      color: var(--mat-sys-primary, #6C3FC5);
      font-size: 0.75rem;
      font-weight: 500;
    }
  `]
})
export class TrackingTimelineComponent {
  @Input() steps: TimelineStep[] = [];
}
